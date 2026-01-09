import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthorized } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// GET - List all conditions
export async function GET(_request: NextRequest) {
  try {
    const conditions = await prisma.conditionOption.findMany({
      orderBy: [{ order: 'asc' }]
    })
    return NextResponse.json(conditions)
  } catch (error) {
    console.error('Error fetching conditions:', error)
    return NextResponse.json({ error: 'Failed to fetch conditions' }, { status: 500 })
  }
}

// POST - Create new condition
export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, label, labelJa, description, order, isActive } = body

    if (!code || !label) {
      return NextResponse.json({ error: 'code, label are required' }, { status: 400 })
    }

    const condition = await prisma.conditionOption.create({
      data: {
        code,
        label,
        labelJa,
        description,
        order: order || 0,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(condition, { status: 201 })
  } catch (error) {
    console.error('Error creating condition:', error)
    return NextResponse.json({ error: 'Failed to create condition' }, { status: 500 })
  }
}
