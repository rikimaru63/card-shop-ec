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

    // 注文を取得して状態を確認
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: { id: true, orderNumber: true, status: true, paymentStatus: true }
    })

    if (!order) {
      return NextResponse.json(
        { error: '注文が見つかりません' },
        { status: 404 }
      )
    }

    // 注文削除時の在庫復元ルール:
    //  - PENDING / PROCESSING (未発送): 在庫を復元する（商品はまだ倉庫にある）
    //  - SHIPPED / DELIVERED (発送・配送済): 復元しない（商品は既に顧客の手元）
    //  - CANCELLED: 既に別プロセスで復元済なのでスキップ
    //  - REFUNDED: 返金処理済。物理的な商品の所在は個別判断のため自動復元せず、
    //    在庫調整は必要なら管理画面から手動で実施する運用とする
    //
    // いずれのケースでも stockReservation は掃除する（孤立レコード防止）。
    const restockableStatuses: string[] = ['PENDING', 'PROCESSING']
    const shouldRestock =
      restockableStatuses.includes(order.status) &&
      order.paymentStatus !== 'CANCELLED'

    await prisma.$transaction(async (tx) => {
      if (shouldRestock) {
        // 確定済み予約（在庫が実際に減算されたもの）を atomic に復元
        const confirmedReservations = await tx.stockReservation.findMany({
          where: { orderNumber: order.orderNumber, confirmed: true }
        })

        for (const reservation of confirmedReservations) {
          // ID指定 atomic delete に成功した予約のみ在庫をincrement（二重復元防止）
          const delResult = await tx.stockReservation.deleteMany({
            where: { id: reservation.id }
          })
          if (delResult.count === 1) {
            await tx.product.update({
              where: { id: reservation.productId },
              data: { stock: { increment: reservation.quantity } }
            })
          }
        }
      }

      // どのstatusでも、予約レコードは必ず全削除（orphan防止）
      await tx.stockReservation.deleteMany({
        where: { orderNumber: order.orderNumber }
      })

      // 関連レコードを削除してから注文を削除
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
