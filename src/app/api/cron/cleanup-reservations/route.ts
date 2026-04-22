import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// This endpoint can be called by:
// 1. Vercel Cron Jobs
// 2. External cron services (e.g., cron-job.org)
// 3. Manual trigger via admin panel

export async function GET(request: Request) {
  try {
    // CRON_SECRET は必須。未設定の場合は 500 で処理拒否（認証バイパス防止）
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error(
        "[cleanup-reservations] CRON_SECRET is not set. Refusing to run cleanup for security."
      )
      return NextResponse.json(
        { error: "Server misconfiguration: CRON_SECRET not set" },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
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
    // ADMIN_API_KEY または CRON_SECRET は必須。未設定の場合は 500 で処理拒否（認証バイパス防止）
    const authHeader = request.headers.get("authorization")
    const adminSecret = process.env.ADMIN_API_KEY || process.env.CRON_SECRET

    if (!adminSecret) {
      console.error(
        "[cleanup-reservations] ADMIN_API_KEY or CRON_SECRET must be set. Refusing to run cleanup for security."
      )
      return NextResponse.json(
        { error: "Server misconfiguration: admin secret not set" },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${adminSecret}`) {
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
  // PROCESSING は顧客が決済完了ボタンを押した状態のため Cron キャンセル対象外。
  // confirmPayment が reservationExpiresAt を null にするため、
  // PROCESSING かつ reservationExpiresAt が残っている注文は不整合状態だが
  // 安全側に倒して Cron では触らない。
  const expiredOrders = await prisma.order.findMany({
    where: {
      paymentStatus: "PENDING",
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
          paymentStatus: "PENDING",
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

      // レースコンディション対策: 各予約をID指定でatomic deleteし、
      // delete成功時のみstockをincrementする。他txが先に削除していたら
      // count===0となり、二重在庫加算を防止する。
      for (const r of confirmedReservations) {
        const delResult = await tx.stockReservation.deleteMany({
          where: { id: r.id }
        })
        if (delResult.count === 1) {
          await tx.product.update({
            where: { id: r.productId },
            data: { stock: { increment: r.quantity } }
          })
          releasedReservations++
        }
      }

      // 未確認の予約も削除（在庫は減っていないので復元不要）
      const unconfirmedDelete = await tx.stockReservation.deleteMany({
        where: { orderNumber: order.orderNumber, confirmed: false }
      })
      releasedReservations += unconfirmedDelete.count

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
