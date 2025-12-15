import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSKU, generateUniqueSlug } from '@/lib/utils/sku'
import { Condition } from '@prisma/client'

// Condition mapping
const conditionMap: { [key: string]: Condition } = {
  'New': 'MINT',
  'new': 'MINT',
  '新品': 'MINT',
  'Used A': 'NEAR_MINT',
  'Used B': 'LIGHTLY_PLAYED',
  'Used C': 'MODERATELY_PLAYED',
  'Used D': 'HEAVILY_PLAYED',
  'Damaged': 'DAMAGED',
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

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { success: 0, failed: 0, errors: ['CSVファイルにデータがありません'] },
        { status: 400 }
      )
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase())

    // Map column indices
    const nameIndex = header.findIndex(h => h === 'namae' || h === 'name' || h === '商品名')
    const stockIndex = header.findIndex(h => h === 'kosuu' || h === 'stock' || h === '在庫数')
    const priceIndex = header.findIndex(h => h === 'kakaku' || h === 'price' || h === '価格')
    const conditionIndex = header.findIndex(h => h === 'codition' || h === 'condition' || h === '状態')
    const categoryIndex = header.findIndex(h => h === 'categori' || h === 'category' || h === 'カテゴリ')

    if (nameIndex === -1 || priceIndex === -1) {
      return NextResponse.json(
        { success: 0, failed: 0, errors: ['必須カラム（namae/name, kakaku/price）が見つかりません'] },
        { status: 400 }
      )
    }

    // Get or create default category
    let defaultCategory = await prisma.category.findFirst({
      where: { slug: 'trading-cards' }
    })

    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: {
          name: 'Trading Cards',
          slug: 'trading-cards',
          description: 'トレーディングカード'
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
        const stock = parseInt(values[stockIndex]) || 0
        const price = parseFloat(values[priceIndex]) || 0
        const conditionStr = values[conditionIndex]?.trim() || 'New'
        const categoryName = values[categoryIndex]?.trim() || ''

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

        // Map condition
        const condition: Condition = conditionMap[conditionStr] || 'MINT'

        // Get or create category if specified
        let categoryId = defaultCategory.id
        if (categoryName) {
          const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          let category = await prisma.category.findFirst({
            where: { slug: categorySlug }
          })
          if (!category) {
            category = await prisma.category.create({
              data: {
                name: categoryName,
                slug: categorySlug,
                description: categoryName
              }
            })
          }
          categoryId = category.id
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
              stock,
              price,
              condition,
              categoryId,
              updatedAt: new Date()
            }
          })
          results.success++
          results.updated.push(name)
        } else {
          // Create new product
          const sku = generateSKU('CARD', String(Date.now()).slice(-6))
          const slug = await generateUniqueSlug(name, prisma)

          await prisma.product.create({
            data: {
              sku,
              slug,
              name,
              stock,
              price,
              condition,
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
      errors: results.errors.slice(0, 20), // Limit error messages
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
