import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthorized } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// PATCH - 配送対象国を更新（渡されたキーのみ反映）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, nameJa, enabledUS, enabledEU, order, isActive } = body

    // 対象が存在するか確認
    const existing = await prisma.shippingCountry.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: '配送対象国が見つかりません' },
        { status: 404 }
      )
    }

    const country = await prisma.shippingCountry.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(nameJa !== undefined && { nameJa }),
        ...(enabledUS !== undefined && { enabledUS }),
        ...(enabledEU !== undefined && { enabledEU }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(country)
  } catch (error) {
    console.error('Error updating shipping country:', error)
    return NextResponse.json(
      { error: '配送対象国の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE - 配送対象国を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // 対象が存在するか確認
    const existing = await prisma.shippingCountry.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: '配送対象国が見つかりません' },
        { status: 404 }
      )
    }

    await prisma.shippingCountry.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shipping country:', error)
    return NextResponse.json(
      { error: '配送対象国の削除に失敗しました' },
      { status: 500 }
    )
  }
}
