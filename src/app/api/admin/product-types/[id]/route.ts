import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthorized } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// PUT - Update product type
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

    const type = await prisma.productTypeOption.update({
      where: { id },
      data: {
        ...(body.code && { code: body.code }),
        ...(body.label && { label: body.label }),
        ...(body.labelJa !== undefined && { labelJa: body.labelJa }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.isActive !== undefined && { isActive: body.isActive })
      }
    })

    return NextResponse.json(type)
  } catch (error) {
    console.error('Error updating product type:', error)
    return NextResponse.json({ error: 'Failed to update product type' }, { status: 500 })
  }
}

// DELETE - Delete product type
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
    await prisma.productTypeOption.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product type:', error)
    return NextResponse.json({ error: 'Failed to delete product type' }, { status: 500 })
  }
}
