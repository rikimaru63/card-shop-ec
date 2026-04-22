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

    await prisma.$transaction(async (tx) => {
      // 確認済みの予約（在庫が減算されたもの）を取得
      const confirmedReservations = await tx.stockReservation.findMany({
        where: { orderNumber, confirmed: true }
      })

      // 各確認済み予約の在庫を復元
      for (const reservation of confirmedReservations) {
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

      // 未確認の予約も含めてすべて削除
      await tx.stockReservation.deleteMany({
        where: { orderNumber }
      })

      // 注文をキャンセル
      await tx.order.update({
        where: { orderNumber },
        data: {
          status: "CANCELLED",
          paymentStatus: "CANCELLED",
          reservationExpiresAt: null,
          notes: [
            order.notes,
            `Stock released by admin at ${new Date().toISOString()}`
          ].filter(Boolean).join("\n")
        }
      })
    })

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
