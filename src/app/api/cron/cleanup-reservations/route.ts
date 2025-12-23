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

  // Find all expired, unconfirmed reservations
  const expiredReservations = await prisma.stockReservation.findMany({
    where: {
      expiresAt: { lt: now },
      confirmed: false
    },
    select: {
      id: true,
      orderNumber: true,
      productId: true,
      quantity: true
    }
  })

  if (expiredReservations.length === 0) {
    return {
      message: "No expired reservations found",
      cancelledOrders: 0,
      releasedReservations: 0
    }
  }

  // Get unique order numbers from expired reservations
  const orderNumbers = [...new Set(
    expiredReservations
      .map(r => r.orderNumber)
      .filter((n): n is string => n !== null)
  )]

  let cancelledOrders = 0
  let releasedReservations = 0

  // Process in transaction
  await prisma.$transaction(async (tx) => {
    // 1. Cancel orders with expired reservations
    for (const orderNumber of orderNumbers) {
      const order = await tx.order.findUnique({
        where: { orderNumber },
        select: { status: true, paymentStatus: true }
      })

      // Only cancel if order is still pending
      if (order && order.status === "PENDING" && order.paymentStatus === "PENDING") {
        await tx.order.update({
          where: { orderNumber },
          data: {
            status: "CANCELLED",
            paymentStatus: "CANCELLED",
            reservationExpiresAt: null,
            notes: "Auto-cancelled: Payment not completed within 30 minutes"
          }
        })
        cancelledOrders++
      }
    }

    // 2. Delete all expired unconfirmed reservations
    const deleteResult = await tx.stockReservation.deleteMany({
      where: {
        expiresAt: { lt: now },
        confirmed: false
      }
    })
    releasedReservations = deleteResult.count
  })

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
