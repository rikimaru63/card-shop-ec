import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthorized } from '@/lib/admin-auth'
import { CardGame } from '@prisma/client'

export const dynamic = 'force-dynamic'

// Initial data
const INITIAL_RARITIES = {
  POKEMON: [
    { code: 'SAR', label: 'SAR', order: 1 },
    { code: 'UR', label: 'UR', order: 2 },
    { code: 'SR', label: 'SR', order: 3 },
    { code: 'HR', label: 'HR', order: 4 },
    { code: 'AR', label: 'AR', order: 5 },
    { code: 'RRR', label: 'RRR', order: 6 },
    { code: 'RR', label: 'RR', order: 7 },
    { code: 'R', label: 'R', order: 8 },
    { code: 'SSR', label: 'SSR', order: 9 },
    { code: 'CSR', label: 'CSR', order: 10 },
    { code: 'CHR', label: 'CHR', order: 11 },
    { code: 'MUR', label: 'MUR', order: 12 },
    { code: 'ACE', label: 'ACE', order: 13 },
    { code: 'MA', label: 'MA', order: 14 },
    { code: 'BWR', label: 'BWR', order: 15 },
    { code: 'S', label: 'S', order: 16 },
    { code: 'K', label: 'K', order: 17 },
    { code: 'A', label: 'A', order: 18 },
    { code: 'PR', label: 'PROMO', order: 99 },
  ],
  ONEPIECE: [
    { code: 'SEC', label: 'SEC', order: 1 },
    { code: 'SR', label: 'SR', order: 2 },
    { code: 'R', label: 'R', order: 3 },
    { code: 'L', label: 'L', order: 4 },
    { code: 'PR', label: 'PROMO', order: 99 },
  ],
}

const INITIAL_GAMES = [
  { code: 'pokemon', label: 'Pokemon', labelJa: 'ポケモン', categorySlug: 'pokemon-cards', order: 1 },
  { code: 'onepiece', label: 'One Piece', labelJa: 'ワンピース', categorySlug: 'onepiece-cards', order: 2 },
  { code: 'other', label: 'Other', labelJa: 'その他', categorySlug: 'other-cards', order: 3 },
]

const INITIAL_PRODUCT_TYPES = [
  { code: 'SINGLE', label: 'Single Cards', labelJa: 'シングルカード', order: 1 },
  { code: 'BOX', label: 'Sealed Box & Packs', labelJa: 'BOX・パック', order: 2 },
  { code: 'OTHER', label: 'Other', labelJa: 'その他', order: 3 },
]

const INITIAL_CONDITIONS = [
  { code: 'SEALED', label: 'Sealed / New', labelJa: '未開封・新品', description: '未開封の商品', order: 1 },
  { code: 'GRADE_A', label: 'Grade A (Near Mint)', labelJa: 'グレードA（美品）', description: 'ほぼ傷なし', order: 2 },
  { code: 'GRADE_B', label: 'Grade B (Good)', labelJa: 'グレードB（良品）', description: '軽微な傷あり', order: 3 },
  { code: 'GRADE_C', label: 'Grade C (Played)', labelJa: 'グレードC（並品）', description: '使用感あり', order: 4 },
  { code: 'PSA', label: 'PSA Graded', labelJa: 'PSA鑑定品', description: 'PSAグレーディング済み', order: 5 },
]

// POST - Seed all filter options
export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = {
      rarities: { created: 0, skipped: 0 },
      games: { created: 0, skipped: 0 },
      productTypes: { created: 0, skipped: 0 },
      conditions: { created: 0, skipped: 0 },
    }

    // Seed Rarities
    for (const game of ['POKEMON', 'ONEPIECE'] as const) {
      for (const rarity of INITIAL_RARITIES[game]) {
        const existing = await prisma.rarityOption.findUnique({
          where: { game_code: { game: game as CardGame, code: rarity.code } }
        })
        if (!existing) {
          await prisma.rarityOption.create({
            data: { game: game as CardGame, ...rarity, isActive: true }
          })
          results.rarities.created++
        } else {
          results.rarities.skipped++
        }
      }
    }

    // Seed Games
    for (const game of INITIAL_GAMES) {
      const existing = await prisma.gameOption.findUnique({
        where: { code: game.code }
      })
      if (!existing) {
        await prisma.gameOption.create({
          data: { ...game, isActive: true }
        })
        results.games.created++
      } else {
        results.games.skipped++
      }
    }

    // Seed Product Types
    for (const type of INITIAL_PRODUCT_TYPES) {
      const existing = await prisma.productTypeOption.findUnique({
        where: { code: type.code }
      })
      if (!existing) {
        await prisma.productTypeOption.create({
          data: { ...type, isActive: true }
        })
        results.productTypes.created++
      } else {
        results.productTypes.skipped++
      }
    }

    // Seed Conditions
    for (const condition of INITIAL_CONDITIONS) {
      const existing = await prisma.conditionOption.findUnique({
        where: { code: condition.code }
      })
      if (!existing) {
        await prisma.conditionOption.create({
          data: { ...condition, isActive: true }
        })
        results.conditions.created++
      } else {
        results.conditions.skipped++
      }
    }

    return NextResponse.json({
      message: 'Filter options seeded successfully',
      results
    }, { status: 201 })

  } catch (error) {
    console.error('Error seeding filter options:', error)
    return NextResponse.json(
      { error: 'Failed to seed filter options' },
      { status: 500 }
    )
  }
}
