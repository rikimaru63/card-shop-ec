import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSKU, generateUniqueSlug } from '@/lib/utils/sku'
import { Condition, Rarity, ProductType } from '@prisma/client'

export const dynamic = 'force-dynamic'

// Condition mapping (case-insensitive support)
const conditionMap: { [key: string]: Condition } = {
  // Grade A
  'A': 'GRADE_A',
  'a': 'GRADE_A',
  'GRADE_A': 'GRADE_A',
  'grade_a': 'GRADE_A',
  'A：美品': 'GRADE_A',
  '美品': 'GRADE_A',
  'Used A': 'GRADE_A',
  'Used - A': 'GRADE_A',
  'used a': 'GRADE_A',
  'used - a': 'GRADE_A',
  'No Shrink': 'GRADE_A',
  'no shrink': 'GRADE_A',
  // Grade B
  'B': 'GRADE_B',
  'b': 'GRADE_B',
  'GRADE_B': 'GRADE_B',
  'grade_b': 'GRADE_B',
  'B：良品': 'GRADE_B',
  '良品': 'GRADE_B',
  'Used B': 'GRADE_B',
  'Used - B': 'GRADE_B',
  'used b': 'GRADE_B',
  'used - b': 'GRADE_B',
  // Grade C
  'C': 'GRADE_C',
  'c': 'GRADE_C',
  'GRADE_C': 'GRADE_C',
  'grade_c': 'GRADE_C',
  'C：ダメージ': 'GRADE_C',
  'ダメージ': 'GRADE_C',
  'Used C': 'GRADE_C',
  'Used - C': 'GRADE_C',
  'used c': 'GRADE_C',
  'used - c': 'GRADE_C',
  'Used D': 'GRADE_C',
  'Used - D': 'GRADE_C',
  'used d': 'GRADE_C',
  'used - d': 'GRADE_C',
  // PSA graded
  'PSA': 'PSA',
  'psa': 'PSA',
  'Unused': 'PSA',
  'unused': 'PSA',
  // Sealed/New
  '未開封': 'SEALED',
  'SEALED': 'SEALED',
  'sealed': 'SEALED',
  'New': 'SEALED',
  'new': 'SEALED',
  '新品': 'SEALED',
}

// Rarity mapping
const rarityMap: { [key: string]: Rarity } = {
  'C': 'COMMON',
  'COMMON': 'COMMON',
  'コモン': 'COMMON',
  'U': 'UNCOMMON',
  'UNCOMMON': 'UNCOMMON',
  'アンコモン': 'UNCOMMON',
  'R': 'RARE',
  'RARE': 'RARE',
  'レア': 'RARE',
  'RR': 'RARE',
  'RRR': 'RARE',
  'SR': 'SUPER_RARE',
  'SUPER_RARE': 'SUPER_RARE',
  'スーパーレア': 'SUPER_RARE',
  'UR': 'ULTRA_RARE',
  'ULTRA_RARE': 'ULTRA_RARE',
  'ウルトラレア': 'ULTRA_RARE',
  'SAR': 'SECRET_RARE',
  'SEC': 'SECRET_RARE',
  'SECRET_RARE': 'SECRET_RARE',
  'シークレット': 'SECRET_RARE',
  'AR': 'SECRET_RARE',
  'CHR': 'SECRET_RARE',
  'CSR': 'SECRET_RARE',
  'PROMO': 'PROMO',
  'プロモ': 'PROMO',
}

// ProductType mapping
const productTypeMap: { [key: string]: ProductType } = {
  'SINGLE': 'SINGLE',
  'single': 'SINGLE',
  'シングル': 'SINGLE',
  'カード': 'SINGLE',
  'BOX': 'BOX',
  'box': 'BOX',
  'ボックス': 'BOX',
  'パック': 'BOX',
  'OTHER': 'OTHER',
  'other': 'OTHER',
  'その他': 'OTHER',
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: 0, failed: 0, errors: ['ファイルが選択されていません'] },
        { status: 400 }
      )
    }

    let text = await file.text()

    // Remove BOM if present
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1)
    }

    // Normalize line endings (CRLF -> LF) and split
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { success: 0, failed: 0, errors: ['CSVファイルにデータがありません'] },
        { status: 400 }
      )
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))

    // Map column indices (support multiple naming conventions)
    const getIndex = (names: string[]) => header.findIndex(h => names.includes(h))

    const nameIndex = getIndex(['name', 'namae', '商品名', '名前'])
    const cardTypeIndex = getIndex(['cardtype', 'card_type', 'カードタイプ', 'ゲーム', 'categori', 'category'])
    const productTypeIndex = getIndex(['producttype', 'product_type', '商品タイプ', 'タイプ'])
    const cardSetIndex = getIndex(['cardset', 'card_set', 'パック名', 'パック', 'セット'])
    const cardNumberIndex = getIndex(['cardnumber', 'card_number', 'カード番号', '番号'])
    const rarityIndex = getIndex(['rarity', 'レアリティ', 'レア度'])
    const conditionIndex = getIndex(['condition', 'codition', '状態', 'コンディション'])
    const priceIndex = getIndex(['price', 'kakaku', '価格'])
    const stockIndex = getIndex(['stock', 'kosuu', '在庫', '在庫数'])
    const descriptionIndex = getIndex(['description', '説明', '備考'])

    if (nameIndex === -1 || priceIndex === -1) {
      return NextResponse.json(
        { success: 0, failed: 0, errors: ['必須カラム（name, price）が見つかりません'] },
        { status: 400 }
      )
    }

    // Debug: Log column indices
    console.log('CSV Import - Column indices:', {
      header: header,
      nameIndex,
      cardTypeIndex,
      productTypeIndex,
      cardSetIndex,
      cardNumberIndex,
      rarityIndex,
      conditionIndex,
      priceIndex,
      stockIndex
    })

    // Get or create categories
    let pokemonCategory = await prisma.category.findFirst({
      where: { slug: 'pokemon-cards' }
    })
    let onepieceCategory = await prisma.category.findFirst({
      where: { slug: 'onepiece-cards' }
    })
    let otherCategory = await prisma.category.findFirst({
      where: { slug: 'other-cards' }
    })

    if (!pokemonCategory) {
      pokemonCategory = await prisma.category.create({
        data: {
          name: 'ポケモンカード',
          slug: 'pokemon-cards',
          description: 'ポケモンカードゲーム'
        }
      })
    }
    if (!onepieceCategory) {
      onepieceCategory = await prisma.category.create({
        data: {
          name: 'ワンピースカード',
          slug: 'onepiece-cards',
          description: 'ワンピースカードゲーム'
        }
      })
    }
    if (!otherCategory) {
      otherCategory = await prisma.category.create({
        data: {
          name: 'その他',
          slug: 'other-cards',
          description: 'その他のカードゲーム'
        }
      })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      created: [] as string[],
      updated: [] as string[]
    }

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        // Parse CSV line (handle quoted values)
        const values = parseCSVLine(line)

        const name = values[nameIndex]?.trim()
        const cardType = values[cardTypeIndex]?.trim().toLowerCase() || 'pokemon'
        const productTypeStr = values[productTypeIndex]?.trim() || 'SINGLE'
        const cardSet = values[cardSetIndex]?.trim() || null
        const cardNumber = values[cardNumberIndex]?.trim() || null
        const rarityStr = values[rarityIndex]?.trim() || null
        const conditionStr = values[conditionIndex]?.trim() || 'GRADE_A'
        const price = parseFloat(values[priceIndex]?.replace(/[¥,]/g, '')) || 0
        const stock = parseInt(values[stockIndex]) || 0
        const description = values[descriptionIndex]?.trim() || null

        if (!name) {
          results.failed++
          results.errors.push(`行 ${i + 1}: 商品名が空です`)
          continue
        }

        if (price <= 0) {
          results.failed++
          results.errors.push(`行 ${i + 1}: 価格が無効です (${name})`)
          continue
        }

        // Map values
        const productType: ProductType = productTypeMap[productTypeStr] || 'SINGLE'
        const conditionUpper = conditionStr.toUpperCase()
        const condition: Condition = conditionMap[conditionStr] || conditionMap[conditionUpper] || 'GRADE_A'
        const rarityUpper = rarityStr?.toUpperCase() || null
        const rarity: Rarity | null = rarityStr ? (rarityMap[rarityStr] || rarityMap[rarityUpper!] || null) : null

        // Debug log
        console.log(`Row ${i + 1}: conditionStr="${conditionStr}", mapped to="${condition}", rarityStr="${rarityStr}", mapped to="${rarity}"`);

        // Determine category based on cardType
        let categoryId = pokemonCategory.id
        if (cardType === 'onepiece') {
          categoryId = onepieceCategory.id
        } else if (cardType === 'other') {
          categoryId = otherCategory.id
        }

        // Check if product already exists by name
        const existingProduct = await prisma.product.findFirst({
          where: { name: name }
        })

        if (existingProduct) {
          // Update existing product
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              productType,
              cardSet,
              cardNumber,
              rarity,
              condition,
              price,
              stock,
              description,
              categoryId,
              updatedAt: new Date()
            }
          })
          results.success++
          results.updated.push(name)
        } else {
          // Create new product
          let skuPrefix = 'PKM'
          if (cardType === 'onepiece') skuPrefix = 'OPC'
          else if (cardType === 'other') skuPrefix = 'OTH'
          const sku = generateSKU(skuPrefix, String(Date.now()).slice(-6))
          const slug = await generateUniqueSlug(name, prisma)

          await prisma.product.create({
            data: {
              sku,
              slug,
              name,
              productType,
              cardSet,
              cardNumber,
              rarity,
              condition,
              price,
              stock,
              description,
              categoryId,
              published: true,
              language: 'JP'
            }
          })
          results.success++
          results.created.push(name)
        }

      } catch (error) {
        results.failed++
        results.errors.push(`行 ${i + 1}: ${error instanceof Error ? error.message : '処理エラー'}`)
      }
    }

    return NextResponse.json({
      success: results.success,
      failed: results.failed,
      errors: results.errors.slice(0, 20),
      created: results.created.length,
      updated: results.updated.length,
      message: `${results.created.length}件を新規登録、${results.updated.length}件を更新しました`
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { success: 0, failed: 0, errors: ['インポート処理中にエラーが発生しました'] },
      { status: 500 }
    )
  }
}

// Parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}
