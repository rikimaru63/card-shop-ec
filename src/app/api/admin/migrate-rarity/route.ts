import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mapping from Japanese rarity strings to database enum values
const RARITY_MAPPING: Record<string, string> = {
  // Common mappings
  "C (コモン)": "COMMON",
  "C": "COMMON",
  "コモン": "COMMON",

  // Uncommon mappings
  "U (アンコモン)": "UNCOMMON",
  "U": "UNCOMMON",
  "アンコモン": "UNCOMMON",

  // Rare mappings
  "R (レア)": "RARE",
  "R": "RARE",
  "レア": "RARE",
  "RR (ダブルレア)": "RARE",
  "RR": "RARE",
  "RRR (トリプルレア)": "RARE",
  "RRR": "RARE",

  // Super Rare mappings
  "SR (スーパーレア)": "SUPER_RARE",
  "SR": "SUPER_RARE",
  "スーパーレア": "SUPER_RARE",

  // Ultra Rare mappings
  "UR (ウルトラレア)": "ULTRA_RARE",
  "UR": "ULTRA_RARE",
  "ウルトラレア": "ULTRA_RARE",

  // Secret Rare mappings (all special/art rares)
  "SAR (スペシャルアートレア)": "SECRET_RARE",
  "SAR": "SECRET_RARE",
  "AR (アートレア)": "SECRET_RARE",
  "AR": "SECRET_RARE",
  "K (かがやく)": "SECRET_RARE",
  "CHR (キャラクターレア)": "SECRET_RARE",
  "CHR": "SECRET_RARE",
  "CSR (キャラクタースーパーレア)": "SECRET_RARE",
  "CSR": "SECRET_RARE",
  "SEC": "SECRET_RARE",

  // Promo mappings
  "プロモ": "PROMO",
  "PROMO": "PROMO",
}

export async function POST() {
  try {
    // Get all products with non-null rarity
    const products = await prisma.product.findMany({
      where: {
        rarity: { not: null }
      },
      select: {
        id: true,
        name: true,
        rarity: true
      }
    })

    const results = {
      total: products.length,
      updated: 0,
      skipped: 0,
      alreadyCorrect: 0,
      errors: [] as string[]
    }

    // Valid enum values
    const validEnumValues = ['COMMON', 'UNCOMMON', 'RARE', 'SUPER_RARE', 'ULTRA_RARE', 'SECRET_RARE', 'PROMO']

    for (const product of products) {
      const currentRarity = product.rarity as string

      // Skip if already a valid enum value
      if (validEnumValues.includes(currentRarity)) {
        results.alreadyCorrect++
        continue
      }

      // Try to map the rarity
      const mappedRarity = RARITY_MAPPING[currentRarity]

      if (mappedRarity) {
        try {
          await prisma.product.update({
            where: { id: product.id },
            data: { rarity: mappedRarity as any }
          })
          results.updated++
        } catch (error) {
          results.errors.push(`Failed to update ${product.name}: ${error}`)
        }
      } else {
        results.skipped++
        results.errors.push(`Unknown rarity "${currentRarity}" for product: ${product.name}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Rarity migration completed',
      results
    })

  } catch (error) {
    console.error('Rarity migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    )
  }
}

// GET endpoint to preview what will be changed
export async function GET() {
  try {
    // Get ALL products to diagnose the issue
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        rarity: true,
        cardSet: true,
        condition: true
      },
      take: 100 // Limit to first 100 for preview
    })

    const validEnumValues = ['COMMON', 'UNCOMMON', 'RARE', 'SUPER_RARE', 'ULTRA_RARE', 'SECRET_RARE', 'PROMO']

    const preview = products.map(product => {
      const currentRarity = product.rarity as string | null

      if (!currentRarity) {
        return {
          id: product.id,
          name: product.name,
          currentRarity: '(null - 未設定)',
          cardSet: product.cardSet || '(未設定)',
          condition: product.condition || '(未設定)',
          newRarity: '-',
          status: 'null'
        }
      }

      const isValid = validEnumValues.includes(currentRarity)
      const mappedRarity = isValid ? currentRarity : RARITY_MAPPING[currentRarity]

      return {
        id: product.id,
        name: product.name,
        currentRarity,
        cardSet: product.cardSet || '(未設定)',
        condition: product.condition || '(未設定)',
        newRarity: mappedRarity || 'UNKNOWN',
        status: isValid ? 'already_correct' : (mappedRarity ? 'will_update' : 'unknown')
      }
    })

    const summary = {
      total: products.length,
      nullRarity: preview.filter(p => p.status === 'null').length,
      alreadyCorrect: preview.filter(p => p.status === 'already_correct').length,
      willUpdate: preview.filter(p => p.status === 'will_update').length,
      unknown: preview.filter(p => p.status === 'unknown').length
    }

    return NextResponse.json({
      summary,
      products: preview
    })

  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json(
      { error: 'Preview failed', details: String(error) },
      { status: 500 }
    )
  }
}
