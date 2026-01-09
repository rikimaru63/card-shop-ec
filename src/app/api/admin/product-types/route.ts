import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthorized } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// GET - List all product types
export async function GET(_request: NextRequest) {
  try {
    const types = await prisma.productTypeOption.findMany({
      orderBy: [{ order: 'asc' }]
    })
    return NextResponse.json(types)
  } catch (error) {
    console.error('Error fetching product types:', error)
    return NextResponse.json({ error: 'Failed to fetch product types' }, { status: 500 })
  }
}

// POST - Create new product type
export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, label, labelJa, order, isActive } = body

    if (!code || !label) {
      return NextResponse.json({ error: 'code, label are required' }, { status: 400 })
    }

    const type = await prisma.productTypeOption.create({
      data: {
        code,
        label,
        labelJa,
        order: order || 0,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(type, { status: 201 })
  } catch (error) {
    console.error('Error creating product type:', error)
    return NextResponse.json({ error: 'Failed to create product type' }, { status: 500 })
  }
}
