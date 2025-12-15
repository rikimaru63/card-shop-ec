import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendVerificationEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, phone, address } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "名前、メールアドレス、パスワードは必須です" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "有効なメールアドレスを入力してください" },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { message: "パスワードは8文字以上で入力してください" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "このメールアドレスは既に登録されています" },
        { status: 400 }
      )
    }

    // Validate address if provided
    if (address) {
      if (!address.firstName || !address.lastName || !address.country ||
          !address.postalCode || !address.state || !address.city || !address.street1) {
        return NextResponse.json(
          { message: "配送先住所の必須項目を入力してください" },
          { status: 400 }
        )
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with address in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          hashedPassword,
          phone: phone || null,
          emailVerificationToken: verificationToken,
          emailVerificationExpiry: verificationExpiry,
        }
      })

      // Create address if provided
      if (address) {
        await tx.address.create({
          data: {
            userId: newUser.id,
            type: 'SHIPPING',
            isDefault: true,
            firstName: address.firstName,
            lastName: address.lastName,
            street1: address.street1,
            street2: address.street2 || null,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            phone: address.phone || null,
          }
        })
      }

      return newUser
    })

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/auth/verify?token=${verificationToken}`

    const emailResult = await sendVerificationEmail({
      to: email,
      name: name,
      verificationUrl: verificationUrl
    })

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
    }

    return NextResponse.json(
      {
        message: "登録が完了しました。メールアドレスに確認メールを送信しました。",
        requiresVerification: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { message: "登録に失敗しました。もう一度お試しください。" },
      { status: 500 }
    )
  }
}
