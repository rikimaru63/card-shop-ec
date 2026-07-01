import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthorized } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// GET - 配送対象国を全件取得（管理画面）
export async function GET(_request: NextRequest) {
  try {
    const countries = await prisma.shippingCountry.findMany({
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(countries)
  } catch (error) {
    console.error('Error fetching shipping countries:', error)
    return NextResponse.json(
      { error: '配送対象国の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST - 配送対象国を新規作成
export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { code, name, nameJa, enabledUS, enabledEU, order } = body

    // 必須チェック
    if (!code || !name) {
      return NextResponse.json(
        { error: '国コードと国名は必須です' },
        { status: 400 }
      )
    }

    // 国コードを整形（前後空白除去 + 大文字化、ISO 3166-1 alpha-2 は2文字想定）
    const normalizedCode = String(code).trim().toUpperCase()

    if (normalizedCode.length !== 2) {
      return NextResponse.json(
        { error: '国コードは2文字で指定してください' },
        { status: 400 }
      )
    }

    // 重複チェック（code は @unique）
    const existing = await prisma.shippingCountry.findUnique({
      where: { code: normalizedCode }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'この国コードは既に登録されています' },
        { status: 400 }
      )
    }

    const country = await prisma.shippingCountry.create({
      data: {
        code: normalizedCode,
        name,
        nameJa: nameJa ?? null,
        enabledUS: enabledUS ?? true,
        enabledEU: enabledEU ?? true,
        order: order ?? 0
      }
    })

    return NextResponse.json(country, { status: 201 })
  } catch (error) {
    console.error('Error creating shipping country:', error)
    return NextResponse.json(
      { error: '配送対象国の作成に失敗しました' },
      { status: 500 }
    )
  }
}
