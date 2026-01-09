import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthorized } from '@/lib/admin-auth'
import { CardGame } from '@prisma/client'

export const dynamic = 'force-dynamic'

// PUT - Update rarity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const rarity = await prisma.rarityOption.update({
      where: { id },
      data: {
        ...(body.game && { game: body.game as CardGame }),
        ...(body.code && { code: body.code }),
        ...(body.label && { label: body.label }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.isActive !== undefined && { isActive: body.isActive })
      }
    })

    return NextResponse.json(rarity)
  } catch (error) {
    console.error('Error updating rarity:', error)
    return NextResponse.json({ error: 'Failed to update rarity' }, { status: 500 })
  }
}

// DELETE - Delete rarity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await prisma.rarityOption.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rarity:', error)
    return NextResponse.json({ error: 'Failed to delete rarity' }, { status: 500 })
  }
}
