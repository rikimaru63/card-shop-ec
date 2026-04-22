"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/**
 * 注文の在庫を解放（復元）するサーバーアクション。
 * 顧客が実際に支払いをせずに「支払い完了」をクリックした場合に使用。
 * 在庫の減算を元に戻し、注文をキャンセルする。
 */
export async function releaseOrderStock(orderNumber: string): Promise<{
  success: boolean
  message?: string
  releasedItems?: { name: string; quantity: number }[]
}> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: { select: { name: true } } } } }
    })

    if (!order) {
      return { success: false, message: "Order not found" }
    }

    if (order.status === "SHIPPED" || order.status === "DELIVERED") {
      return { success: false, message: "Cannot release stock for shipped/delivered orders" }
    }

    if (order.status === "CANCELLED" || order.paymentStatus === "CANCELLED") {
      return { success: false, message: "This order is already cancelled" }
    }

    const releasedItems: { name: string; quantity: number }[] = []

    // TOCTOU対策: transaction内で条件付きupdateManyを使い、
    // 「まだキャンセル可能な状態」のときだけatomicにCANCELLED化する。
    // 外側のチェック後に他プロセス(Cron等)がキャンセル or 出荷した場合は
    // count===0となり、在庫復元もスキップされる。
    const released = await prisma.$transaction(async (tx) => {
      const cancelResult = await tx.order.updateMany({
        where: {
          orderNumber,
          status: { notIn: ["CANCELLED", "SHIPPED", "DELIVERED"] },
          paymentStatus: { notIn: ["CANCELLED"] }
        },
        data: {
          status: "CANCELLED",
          paymentStatus: "CANCELLED",
          reservationExpiresAt: null
        }
      })

      if (cancelResult.count === 0) {
        // 他プロセスが先に状態を変えている
        return false
      }

      // 確認済みの予約（在庫が減算されたもの）を取得
      const confirmedReservations = await tx.stockReservation.findMany({
        where: { orderNumber, confirmed: true }
      })

      // レースコンディション対策: ID指定atomic deleteに成功した予約のみ在庫復元。
      // 他txが先に削除していたらcount===0となり、二重在庫加算を防止する。
      for (const reservation of confirmedReservations) {
        const delResult = await tx.stockReservation.deleteMany({
          where: { id: reservation.id }
        })
        if (delResult.count === 1) {
          await tx.product.update({
            where: { id: reservation.productId },
            data: { stock: { increment: reservation.quantity } }
          })
          const orderItem = order.items.find(i => i.productId === reservation.productId)
          releasedItems.push({
            name: orderItem?.product?.name || reservation.productId,
            quantity: reservation.quantity
          })
        }
      }

      // 未確認の予約を削除（在庫は減っていないので復元不要）
      await tx.stockReservation.deleteMany({
        where: { orderNumber, confirmed: false }
      })

      // キャンセル理由をnotesに追記
      await tx.order.update({
        where: { orderNumber },
        data: {
          notes: [
            order.notes,
            `Stock released by admin at ${new Date().toISOString()}`
          ].filter(Boolean).join("\n")
        }
      })

      return true
    })

    if (!released) {
      return { success: false, message: "この注文は既にキャンセル済みか、処理中です" }
    }

    revalidatePath("/admin/orders")
    revalidatePath("/admin/products")
    revalidatePath("/products")

    return {
      success: true,
      message: `Stock released for ${releasedItems.length} item(s)`,
      releasedItems
    }
  } catch (error) {
    console.error("Failed to release order stock:", error)
    return { success: false, message: "Failed to release stock. Please try again." }
  }
}
