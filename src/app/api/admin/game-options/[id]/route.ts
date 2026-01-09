import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthorized } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// PUT - Update game option
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

    const game = await prisma.gameOption.update({
      where: { id },
      data: {
        ...(body.code && { code: body.code }),
        ...(body.label && { label: body.label }),
        ...(body.labelJa !== undefined && { labelJa: body.labelJa }),
        ...(body.categorySlug !== undefined && { categorySlug: body.categorySlug }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.isActive !== undefined && { isActive: body.isActive })
      }
    })

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error updating game option:', error)
    return NextResponse.json({ error: 'Failed to update game option' }, { status: 500 })
  }
}

// DELETE - Delete game option
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
    await prisma.gameOption.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting game option:', error)
    return NextResponse.json({ error: 'Failed to delete game option' }, { status: 500 })
  }
}
