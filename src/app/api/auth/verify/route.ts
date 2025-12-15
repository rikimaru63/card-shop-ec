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
        { message: "確認トークンが必要です" },
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
        { message: "無効または期限切れのトークンです" },
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
      message: "メールアドレスが確認されました。ログインできます。",
      success: true
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json(
      { message: "確認に失敗しました: " + (error instanceof Error ? error.message : "Unknown") },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: "メールアドレスが必要です" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({
        message: "確認メールを再送信しました",
        success: true
      })
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: "このメールアドレスは既に確認済みです" },
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
    const cleanBaseUrl = baseUrl.replace(//$/, '')
    const verificationUrl = cleanBaseUrl + '/auth/verify?token=' + verificationToken

    await sendVerificationEmail({
      to: email,
      name: user.name || 'ユーザー',
      verificationUrl: verificationUrl
    })

    return NextResponse.json({
      message: "確認メールを再送信しました",
      success: true
    })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json(
      { message: "再送信に失敗しました" },
      { status: 500 }
    )
  }
}
