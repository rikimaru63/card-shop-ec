import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// This endpoint can be called by:
// 1. Vercel Cron Jobs
// 2. External cron services (e.g., cron-job.org)
// 3. Manual trigger via admin panel

export async function GET(request: Request) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // If CRON_SECRET is set, require authorization
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const result = await cleanupExpiredReservations()

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error("Cleanup cron error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST method for manual triggers
export async function POST(request: Request) {
  try {
    // Verify admin authorization for manual triggers
    const authHeader = request.headers.get("authorization")
    const adminSecret = process.env.ADMIN_API_KEY || process.env.CRON_SECRET

    if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const result = await cleanupExpiredReservations()

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error("Cleanup manual trigger error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function cleanupExpiredReservations() {
  const now = new Date()

  // 24h経過した未決済注文を取得（二重処理防止のためCANCELLED/REFUNDEDは除外）
  const expiredOrders = await prisma.order.findMany({
    where: {
      paymentStatus: { in: ["PENDING", "PROCESSING"] },
      status: { notIn: ["CANCELLED", "REFUNDED"] },
      reservationExpiresAt: { lt: now }
    },
    include: {
      items: {
        include: {
          product: { select: { name: true } }
        }
      }
    }
  })

  if (expiredOrders.length === 0) {
    return {
      message: "No expired orders found",
      cancelledOrders: 0,
      releasedReservations: 0
    }
  }

  let cancelledOrders = 0
  let releasedReservations = 0

  for (const order of expiredOrders) {
    await prisma.$transaction(async (tx) => {
      // TOCTOU対策: transaction内で条件付きupdateManyを使い、
      // 「まだ未決済かつキャンセルされていない」状態のときだけキャンセル処理する。
      // findMany取得時点からの間に顧客が決済完了 or 他プロセスが先にキャンセルした場合は
      // count===0 となり、在庫復元もスキップされる。
      const cancelResult = await tx.order.updateMany({
        where: {
          id: order.id,
          paymentStatus: { in: ["PENDING", "PROCESSING"] },
          status: { notIn: ["CANCELLED", "REFUNDED"] },
          reservationExpiresAt: { lt: now }
        },
        data: {
          status: "CANCELLED",
          paymentStatus: "CANCELLED",
          reservationExpiresAt: null
        }
      })

      if (cancelResult.count === 0) {
        // 既に他プロセスで状態が変わっている（決済完了 or 先行キャンセル等）
        return
      }

      // 確定済み予約を取得（在庫が実際に減算されたもの）
      const confirmedReservations = await tx.stockReservation.findMany({
        where: { orderNumber: order.orderNumber, confirmed: true }
      })

      // 在庫復元
      for (const r of confirmedReservations) {
        await tx.product.update({
          where: { id: r.productId },
          data: { stock: { increment: r.quantity } }
        })
      }

      // 予約削除（確認済み・未確認を問わず）
      const deleteResult = await tx.stockReservation.deleteMany({
        where: { orderNumber: order.orderNumber }
      })
      releasedReservations += deleteResult.count

      // キャンセル理由をnotesに追記（取得時点のnotesに新しいメッセージを append）
      await tx.order.update({
        where: { id: order.id },
        data: {
          notes: [
            order.notes,
            `Auto-cancelled after 24h unpaid at ${now.toISOString()}`
          ].filter(Boolean).join("\n")
        }
      })

      cancelledOrders++
    })
  }

  // Revalidate affected pages
  revalidatePath("/account/orders")
  revalidatePath("/admin/orders")
  revalidatePath("/products")
  revalidatePath("/admin/products")

  console.log(`Cleanup completed: ${cancelledOrders} orders cancelled, ${releasedReservations} reservations released`)

  return {
    message: "Cleanup completed",
    cancelledOrders,
    releasedReservations,
    processedAt: now.toISOString()
  }
}
