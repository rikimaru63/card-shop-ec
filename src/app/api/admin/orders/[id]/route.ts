import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthorized } from '@/lib/admin-auth'

// GET - Fetch single order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: {
                  take: 1
                }
              }
            }
          }
        },
        payment: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: '注文が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: '注文の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PATCH - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { status, paymentStatus, trackingNumber, notes } = body

    const updateData: any = {}

    if (status) {
      updateData.status = status
      if (status === 'SHIPPED') {
        updateData.shippedAt = new Date()
      }
      if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date()
      }
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus
      // Also update payment record if exists
      const order = await prisma.order.findUnique({
        where: { id: params.id },
        include: { payment: true }
      })
      if (order?.payment) {
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: { status: paymentStatus }
        })
      }
    }

    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        payment: true
      }
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: '注文の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE - Delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete related records first, then order
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: params.id } })
      await tx.payment.deleteMany({ where: { orderId: params.id } })
      await tx.order.delete({ where: { id: params.id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { error: '注文の削除に失敗しました' },
      { status: 500 }
    )
  }
}
