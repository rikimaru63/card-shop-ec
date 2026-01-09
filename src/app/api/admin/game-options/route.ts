import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthorized } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// GET - List all game options
export async function GET(_request: NextRequest) {
  try {
    const games = await prisma.gameOption.findMany({
      orderBy: [{ order: 'asc' }]
    })
    return NextResponse.json(games)
  } catch (error) {
    console.error('Error fetching game options:', error)
    return NextResponse.json({ error: 'Failed to fetch game options' }, { status: 500 })
  }
}

// POST - Create new game option
export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, label, labelJa, categorySlug, order, isActive } = body

    if (!code || !label) {
      return NextResponse.json({ error: 'code, label are required' }, { status: 400 })
    }

    const game = await prisma.gameOption.create({
      data: {
        code,
        label,
        labelJa,
        categorySlug,
        order: order || 0,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(game, { status: 201 })
  } catch (error) {
    console.error('Error creating game option:', error)
    return NextResponse.json({ error: 'Failed to create game option' }, { status: 500 })
  }
}
