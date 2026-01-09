import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthorized } from '@/lib/admin-auth'
import { CardGame } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET - Get single card set
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const cardSet = await prisma.cardSet.findUnique({
      where: { id }
    })

    if (!cardSet) {
      return NextResponse.json(
        { error: 'カードセットが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(cardSet)
  } catch (error) {
    console.error('Error fetching card set:', error)
    return NextResponse.json(
      { error: 'カードセットの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT - Update card set
export async function PUT(
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
    const { game, label, value, code, releaseDate, isActive, order } = body

    // Check if card set exists
    const existing = await prisma.cardSet.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'カードセットが見つかりません' },
        { status: 404 }
      )
    }

    // Check for duplicate if value changed
    if (value && value !== existing.value) {
      const duplicate = await prisma.cardSet.findFirst({
        where: {
          game: (game as CardGame) || existing.game,
          value,
          NOT: { id }
        }
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'このカードセットは既に存在します' },
          { status: 400 }
        )
      }
    }

    const cardSet = await prisma.cardSet.update({
      where: { id },
      data: {
        ...(game && { game: game as CardGame }),
        ...(label && { label }),
        ...(value && { value }),
        ...(code !== undefined && { code: code || null }),
        ...(releaseDate !== undefined && {
          releaseDate: releaseDate ? new Date(releaseDate) : null
        }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order })
      }
    })

    return NextResponse.json(cardSet)
  } catch (error) {
    console.error('Error updating card set:', error)
    return NextResponse.json(
      { error: 'カードセットの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE - Delete card set
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

    // Check if card set exists
    const existing = await prisma.cardSet.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'カードセットが見つかりません' },
        { status: 404 }
      )
    }

    await prisma.cardSet.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting card set:', error)
    return NextResponse.json(
      { error: 'カードセットの削除に失敗しました' },
      { status: 500 }
    )
  }
}
