import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Public API to get all filter options
export async function GET(_request: NextRequest) {
  try {
    // Fetch all active options in parallel
    const [rarities, games, productTypes, conditions, cardSets] = await Promise.all([
      prisma.rarityOption.findMany({
        where: { isActive: true },
        orderBy: [{ order: 'asc' }, { code: 'asc' }],
        select: { id: true, game: true, code: true, label: true }
      }),
      prisma.gameOption.findMany({
        where: { isActive: true },
        orderBy: [{ order: 'asc' }],
        select: { id: true, code: true, label: true, labelJa: true, categorySlug: true }
      }),
      prisma.productTypeOption.findMany({
        where: { isActive: true },
        orderBy: [{ order: 'asc' }],
        select: { id: true, code: true, label: true, labelJa: true }
      }),
      prisma.conditionOption.findMany({
        where: { isActive: true },
        orderBy: [{ order: 'asc' }],
        select: { id: true, code: true, label: true, labelJa: true, description: true }
      }),
      prisma.cardSet.findMany({
        where: { isActive: true },
        orderBy: [{ order: 'asc' }, { releaseDate: 'desc' }],
        select: { id: true, game: true, label: true, value: true, code: true }
      })
    ])

    // Group rarities by game
    const raritiesByGame = {
      POKEMON: rarities.filter(r => r.game === 'POKEMON'),
      ONEPIECE: rarities.filter(r => r.game === 'ONEPIECE'),
      OTHER: rarities.filter(r => r.game === 'OTHER')
    }

    // Group card sets by game
    const cardSetsByGame = {
      POKEMON: cardSets.filter(s => s.game === 'POKEMON'),
      ONEPIECE: cardSets.filter(s => s.game === 'ONEPIECE'),
      OTHER: cardSets.filter(s => s.game === 'OTHER')
    }

    return NextResponse.json({
      rarities: raritiesByGame,
      games,
      productTypes,
      conditions,
      cardSets: cardSetsByGame
    })
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    )
  }
}
