import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthorized } from '@/lib/admin-auth'
import { CardGame } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET - List all card sets (admin)
export async function GET(_request: NextRequest) {
  try {
    const cardSets = await prisma.cardSet.findMany({
      orderBy: [
        { game: 'asc' },
        { order: 'asc' },
        { releaseDate: 'desc' }
      ]
    })

    return NextResponse.json(cardSets)
  } catch (error) {
    console.error('Error fetching card sets:', error)
    return NextResponse.json(
      { error: 'カードセットの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST - Create new card set
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
    const { game, label, value, code, releaseDate, isActive, order } = body

    if (!game || !label || !value) {
      return NextResponse.json(
        { error: 'ゲーム、ラベル、値は必須です' },
        { status: 400 }
      )
    }

    // Validate game enum
    if (!['POKEMON', 'ONEPIECE', 'OTHER'].includes(game)) {
      return NextResponse.json(
        { error: '無効なゲームタイプです' },
        { status: 400 }
      )
    }

    // Check for duplicate
    const existing = await prisma.cardSet.findFirst({
      where: { game: game as CardGame, value }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'このカードセットは既に存在します' },
        { status: 400 }
      )
    }

    const cardSet = await prisma.cardSet.create({
      data: {
        game: game as CardGame,
        label,
        value,
        code: code || null,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        isActive: isActive ?? true,
        order: order || 0
      }
    })

    return NextResponse.json(cardSet, { status: 201 })
  } catch (error) {
    console.error('Error creating card set:', error)
    return NextResponse.json(
      { error: 'カードセットの作成に失敗しました' },
      { status: 500 }
    )
  }
}
