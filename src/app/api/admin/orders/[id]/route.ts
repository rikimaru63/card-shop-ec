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

    // 事前存在チェックのみ（UI向け404判定用）。
    // 在庫復元要否はtransaction内で最新状態を読んで判定する（TOCTOU対策）。
    const existing = await prisma.order.findUnique({
      where: { id: params.id },
      select: { id: true }
    })

    if (!existing) {
      return NextResponse.json(
        { error: '注文が見つかりません' },
        { status: 404 }
      )
    }

    // 注文削除時の在庫復元ルール（order.status と paymentStatus 両方がホワイトリスト内のときのみ復元）:
    //
    //  Order Status:
    //    - PENDING / PROCESSING (未発送): 倉庫にある可能性が高いので復元対象
    //    - SHIPPED / DELIVERED    : 復元しない（既に顧客の手元）
    //    - CANCELLED              : 復元しない（別プロセスが復元済み）
    //    - REFUNDED               : 復元しない（返金処理済、物理所在は個別判断）
    //
    //  Payment Status (どちらも満たす必要):
    //    - PENDING / PROCESSING / FAILED : 決済未完了 → 復元対象
    //    - COMPLETED : 決済完了済。発送前の例外削除の場合でも手動判断に委ねる
    //    - REFUNDED  : 返金済。物理所在は個別判断のため自動復元しない
    //    - CANCELLED : 復元しない
    //
    // 物理在庫の不整合が疑わしいケースは管理画面から手動調整する運用とする。
    // いずれのケースでも stockReservation は必ず掃除する（孤立レコード防止）。
    const restockableOrderStatuses: string[] = ['PENDING', 'PROCESSING']
    const restockablePaymentStatuses: string[] = ['PENDING', 'PROCESSING', 'FAILED']

    await prisma.$transaction(async (tx) => {
      // TOCTOU対策: SELECT ... FOR UPDATE で Order 行ロックを取得し、
      // 他 tx が status/paymentStatus を UPDATE するのをブロックする。
      // その上で最新の status/paymentStatus を読み直して復元判定する。
      await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${params.id} FOR UPDATE`

      const freshOrder = await tx.order.findUnique({
        where: { id: params.id },
        select: { orderNumber: true, status: true, paymentStatus: true }
      })

      if (!freshOrder) {
        // 他 tx が先に削除した場合。冪等性のため正常終了扱いにする。
        return
      }

      const shouldRestock =
        restockableOrderStatuses.includes(freshOrder.status) &&
        restockablePaymentStatuses.includes(freshOrder.paymentStatus)

      if (shouldRestock) {
        // 確定済み予約（在庫が実際に減算されたもの）を atomic に復元
        const confirmedReservations = await tx.stockReservation.findMany({
          where: { orderNumber: freshOrder.orderNumber, confirmed: true }
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
        where: { orderNumber: freshOrder.orderNumber }
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
