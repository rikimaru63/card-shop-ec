import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSKU, generateUniqueSlug } from '@/lib/utils/sku'
import { Condition, ProductType } from '@prisma/client'

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

// Shared CSV parsing and validation logic
function parseCSV(text: string) {
  // Remove BOM if present
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1)
  }

  // Normalize line endings (CRLF -> LF) and split
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim())

  if (lines.length < 2) {
    return { error: 'CSVファイルにデータがありません', lines: [], header: [], indices: null as any }
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))

  // Map column indices (support multiple naming conventions)
  const getIndex = (names: string[]) => header.findIndex(h => names.includes(h))

  const indices = {
    name: getIndex(['name', 'namae', '商品名', '名前']),
    cardType: getIndex(['cardtype', 'card_type', 'カードタイプ', 'ゲーム', 'categori', 'category']),
    productType: getIndex(['producttype', 'product_type', '商品タイプ', 'タイプ']),
    cardSet: getIndex(['cardset', 'card_set', 'パック名', 'パック', 'セット']),
    cardNumber: getIndex(['cardnumber', 'card_number', 'カード番号', '番号']),
    rarity: getIndex(['rarity', 'レアリティ', 'レア度']),
    condition: getIndex(['condition', 'codition', '状態', 'コンディション']),
    price: getIndex(['price', 'kakaku', '価格']),
    stock: getIndex(['stock', 'kosuu', '在庫', '在庫数']),
    description: getIndex(['description', '説明', '備考']),
  }

  if (indices.name === -1 || indices.price === -1) {
    return { error: '必須カラム（name, price）が見つかりません', lines: [], header: [], indices: null as any }
  }

  return { error: null, lines, header, indices }
}

// Parse a single CSV row into structured data
function parseRow(values: string[], indices: ReturnType<typeof parseCSV>['indices']) {
  const name = values[indices.name]?.trim()
  const cardType = values[indices.cardType]?.trim().toLowerCase() || 'pokemon'
  const productTypeStr = values[indices.productType]?.trim() || 'SINGLE'
  const cardSet = values[indices.cardSet]?.trim() || null
  const cardNumber = values[indices.cardNumber]?.trim() || null
  const rarityStr = values[indices.rarity]?.trim() || null
  const conditionStr = values[indices.condition]?.trim() || 'GRADE_A'
  const price = parseFloat(values[indices.price]?.replace(/[¥,]/g, '')) || 0
  const stock = parseInt(values[indices.stock]) || 0
  const description = values[indices.description]?.trim() || null

  const productType: ProductType = productTypeMap[productTypeStr] || 'SINGLE'
  const conditionUpper = conditionStr.toUpperCase()
  const condition: Condition = conditionMap[conditionStr] || conditionMap[conditionUpper] || 'GRADE_A'
  const rarity: string | null = rarityStr || null

  return { name, cardType, productType, cardSet, cardNumber, rarity, condition, conditionStr, price, stock, description }
}

// Ensure categories exist and return them
async function ensureCategories() {
  let pokemonCategory = await prisma.category.findFirst({ where: { slug: 'pokemon-cards' } })
  let onepieceCategory = await prisma.category.findFirst({ where: { slug: 'onepiece-cards' } })
  let otherCategory = await prisma.category.findFirst({ where: { slug: 'other-cards' } })

  if (!pokemonCategory) {
    pokemonCategory = await prisma.category.create({
      data: { name: 'ポケモンカード', slug: 'pokemon-cards', description: 'ポケモンカードゲーム' }
    })
  }
  if (!onepieceCategory) {
    onepieceCategory = await prisma.category.create({
      data: { name: 'ワンピースカード', slug: 'onepiece-cards', description: 'ワンピースカードゲーム' }
    })
  }
  if (!otherCategory) {
    otherCategory = await prisma.category.create({
      data: { name: 'その他', slug: 'other-cards', description: 'その他のカードゲーム' }
    })
  }

  return { pokemonCategory, onepieceCategory, otherCategory }
}

function getCategoryId(cardType: string, categories: Awaited<ReturnType<typeof ensureCategories>>) {
  if (cardType === 'onepiece') return categories.onepieceCategory.id
  if (cardType === 'other') return categories.otherCategory.id
  return categories.pokemonCategory.id
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const mode = url.searchParams.get('mode') || 'preview' // Default to preview for safety

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: 0, failed: 0, errors: ['ファイルが選択されていません'] },
        { status: 400 }
      )
    }

    const text = await file.text()
    const parsed = parseCSV(text)

    if (parsed.error) {
      return NextResponse.json(
        { success: 0, failed: 0, errors: [parsed.error] },
        { status: 400 }
      )
    }

    const { lines, indices } = parsed

    // Debug: Log column indices
    console.log('CSV Import - Column indices:', indices)

    const categories = await ensureCategories()

    if (mode === 'preview') {
      return await handlePreview(lines, indices, categories)
    } else if (mode === 'apply') {
      return await handleApply(lines, indices, categories)
    } else {
      return NextResponse.json(
        { errors: ['無効なモードです。preview または apply を指定してください'] },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { success: 0, failed: 0, errors: ['インポート処理中にエラーが発生しました'] },
      { status: 500 }
    )
  }
}

// Preview mode: parse CSV and compare with existing DB data without writing
async function handlePreview(
  lines: string[],
  indices: ReturnType<typeof parseCSV>['indices'],
  categories: Awaited<ReturnType<typeof ensureCategories>>
) {
  const changes: Array<{
    row: number
    name: string
    currentPrice: number | null
    newPrice: number
    diff: number | null
    currentStock: number | null
    newStock: number
    action: 'UPDATE' | 'CREATE'
  }> = []
  const errors: string[] = []
  let updates = 0, creates = 0, noChange = 0

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      const values = parseCSVLine(line)
      const row = parseRow(values, indices)

      if (!row.name) {
        errors.push(`行 ${i + 1}: 商品名が空です`)
        continue
      }
      if (row.price <= 0) {
        errors.push(`行 ${i + 1}: 価格が無効です (${row.name})`)
        continue
      }

      const existingProduct = await prisma.product.findFirst({
        where: { name: row.name },
        select: { price: true, stock: true }
      })

      if (existingProduct) {
        const priceChanged = Number(existingProduct.price) !== row.price
        const stockChanged = Number(existingProduct.stock) !== row.stock

        if (priceChanged || stockChanged) {
          changes.push({
            row: i + 1,
            name: row.name,
            currentPrice: Number(existingProduct.price),
            newPrice: row.price,
            diff: row.price - Number(existingProduct.price),
            currentStock: Number(existingProduct.stock),
            newStock: row.stock,
            action: 'UPDATE'
          })
          updates++
        } else {
          noChange++
        }
      } else {
        changes.push({
          row: i + 1,
          name: row.name,
          currentPrice: null,
          newPrice: row.price,
          diff: null,
          currentStock: null,
          newStock: row.stock,
          action: 'CREATE'
        })
        creates++
      }
    } catch (error) {
      errors.push(`行 ${i + 1}: ${error instanceof Error ? error.message : '処理エラー'}`)
    }
  }

  return NextResponse.json({
    mode: 'preview',
    changes,
    summary: {
      total: updates + creates + noChange,
      updates,
      creates,
      noChange
    },
    errors: errors.slice(0, 20)
  })
}

// Apply mode: actually write to DB (same logic as the original import)
async function handleApply(
  lines: string[],
  indices: ReturnType<typeof parseCSV>['indices'],
  categories: Awaited<ReturnType<typeof ensureCategories>>
) {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
    created: [] as string[],
    updated: [] as string[]
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      const values = parseCSVLine(line)
      const row = parseRow(values, indices)

      if (!row.name) {
        results.failed++
        results.errors.push(`行 ${i + 1}: 商品名が空です`)
        continue
      }
      if (row.price <= 0) {
        results.failed++
        results.errors.push(`行 ${i + 1}: 価格が無効です (${row.name})`)
        continue
      }

      // Debug log
      console.log(`Row ${i + 1}: conditionStr="${row.conditionStr}", mapped to="${row.condition}"`)

      const categoryId = getCategoryId(row.cardType, categories)

      const existingProduct = await prisma.product.findFirst({
        where: { name: row.name }
      })

      if (existingProduct) {
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            productType: row.productType,
            cardSet: row.cardSet,
            cardNumber: row.cardNumber,
            rarity: row.rarity,
            condition: row.condition,
            price: row.price,
            stock: row.stock,
            description: row.description,
            categoryId,
            updatedAt: new Date()
          }
        })
        results.success++
        results.updated.push(row.name)
      } else {
        let skuPrefix = 'PKM'
        if (row.cardType === 'onepiece') skuPrefix = 'OPC'
        else if (row.cardType === 'other') skuPrefix = 'OTH'
        const sku = generateSKU(skuPrefix, String(Date.now()).slice(-6))
        const slug = await generateUniqueSlug(row.name, prisma)

        await prisma.product.create({
          data: {
            sku,
            slug,
            name: row.name,
            productType: row.productType,
            cardSet: row.cardSet,
            cardNumber: row.cardNumber,
            rarity: row.rarity,
            condition: row.condition,
            price: row.price,
            stock: row.stock,
            description: row.description,
            categoryId,
            published: true,
            language: 'JP'
          }
        })
        results.success++
        results.created.push(row.name)
      }
    } catch (error) {
      results.failed++
      results.errors.push(`行 ${i + 1}: ${error instanceof Error ? error.message : '処理エラー'}`)
    }
  }

  return NextResponse.json({
    mode: 'apply',
    success: results.success,
    failed: results.failed,
    errors: results.errors.slice(0, 20),
    created: results.created.length,
    updated: results.updated.length,
    message: `${results.created.length}件を新規登録、${results.updated.length}件を更新しました`
  })
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
