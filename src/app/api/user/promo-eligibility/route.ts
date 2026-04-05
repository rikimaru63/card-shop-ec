import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ eligible: false, reason: "not-authenticated" })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ eligible: false, reason: "user-not-found" })
    }

    // Count completed orders (paymentStatus PROCESSING or COMPLETED, not cancelled)
    const completedOrderCount = await prisma.order.count({
      where: {
        userId: user.id,
        status: { not: "CANCELLED" },
        paymentStatus: { in: ["PROCESSING", "COMPLETED"] }
      }
    })

    const eligible = completedOrderCount === 0

    return NextResponse.json({ eligible })
  } catch (error) {
    console.error("Error checking promo eligibility:", error)
    return NextResponse.json({ eligible: false, reason: "error" })
  }
}
