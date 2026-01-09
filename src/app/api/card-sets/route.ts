import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CardGame } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET - Public API to get card sets for filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const game = searchParams.get('game')?.toUpperCase() as CardGame | undefined

    const where: { isActive: boolean; game?: CardGame } = {
      isActive: true
    }

    if (game && ['POKEMON', 'ONEPIECE', 'OTHER'].includes(game)) {
      where.game = game
    }

    const cardSets = await prisma.cardSet.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { releaseDate: 'desc' },
        { label: 'asc' }
      ],
      select: {
        id: true,
        game: true,
        label: true,
        value: true,
        code: true,
        releaseDate: true
      }
    })

    // Group by game for convenience
    const grouped = {
      pokemon: cardSets.filter(s => s.game === 'POKEMON'),
      onepiece: cardSets.filter(s => s.game === 'ONEPIECE'),
      other: cardSets.filter(s => s.game === 'OTHER')
    }

    return NextResponse.json({
      cardSets,
      grouped
    })
  } catch (error) {
    console.error('Error fetching card sets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch card sets' },
      { status: 500 }
    )
  }
}
