import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthorized } from '@/lib/admin-auth'
import { CardGame } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET - List all rarities
export async function GET(_request: NextRequest) {
  try {
    const rarities = await prisma.rarityOption.findMany({
      orderBy: [{ game: 'asc' }, { order: 'asc' }]
    })
    return NextResponse.json(rarities)
  } catch (error) {
    console.error('Error fetching rarities:', error)
    return NextResponse.json({ error: 'Failed to fetch rarities' }, { status: 500 })
  }
}

// POST - Create new rarity
export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { game, code, label, order, isActive } = body

    if (!game || !code || !label) {
      return NextResponse.json({ error: 'game, code, label are required' }, { status: 400 })
    }

    const rarity = await prisma.rarityOption.create({
      data: {
        game: game as CardGame,
        code,
        label,
        order: order || 0,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(rarity, { status: 201 })
  } catch (error) {
    console.error('Error creating rarity:', error)
    return NextResponse.json({ error: 'Failed to create rarity' }, { status: 500 })
  }
}
