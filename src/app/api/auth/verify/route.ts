import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET endpoint for testing API connectivity
export async function GET() {
  try {
    const count = await prisma.user.count()
    return NextResponse.json({
      status: "ok",
      message: "Verify API is working",
      userCount: count
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { message: "Verification token is required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiry: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired verification token" },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      }
    })

    return NextResponse.json({
      message: "Your email has been verified. You can now sign in.",
      success: true
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json(
      { message: "Verification failed: " + (error instanceof Error ? error.message : "Unknown") },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: "Email address is required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Return success even if user not found (security)
      return NextResponse.json({
        message: "Verification email has been resent",
        success: true
      })
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: "This email address has already been verified" },
        { status: 400 }
      )
    }

    const crypto = await import('crypto')
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      }
    })

    const { sendVerificationEmail } = await import('@/lib/email')
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    const verificationUrl = cleanBaseUrl + '/auth/verify?token=' + verificationToken

    await sendVerificationEmail({
      to: email,
      name: user.name || 'Customer',
      verificationUrl: verificationUrl
    })

    return NextResponse.json({
      message: "Verification email has been resent",
      success: true
    })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json(
      { message: "Failed to resend verification email" },
      { status: 500 }
    )
  }
}
