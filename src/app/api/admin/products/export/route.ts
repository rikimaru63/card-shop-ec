import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Fetch all products with category and images
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: {
            slug: true,
            name: true
          }
        },
        images: {
          take: 1,
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // CSV header matching the new import template
    const headers = [
      'name',
      'cardType',
      'productType',
      'cardSet',
      'cardNumber',
      'rarity',
      'condition',
      'price',
      'stock',
      'description',
      'sku',
      'imageUrl'
    ]

    // Convert products to CSV rows
    const rows = products.map(product => {
      // Determine cardType from category slug
      const cardType = product.category?.slug === 'onepiece-cards' ? 'onepiece' : 'pokemon'

      return [
        escapeCSV(product.name),
        cardType,
        product.productType || 'SINGLE',
        escapeCSV(product.cardSet || ''),
        escapeCSV(product.cardNumber || ''),
        product.rarity || '',
        product.condition || 'GRADE_A',
        product.price.toString(),
        product.stock.toString(),
        escapeCSV(product.description || ''),
        escapeCSV(product.sku),
        escapeCSV(product.images[0]?.url || '')
      ].join(',')
    })

    // Combine header and rows
    const csv = [headers.join(','), ...rows].join('\n')

    // Add BOM for Excel compatibility with Japanese characters
    const bom = '\uFEFF'
    const csvWithBom = bom + csv

    // Return as downloadable CSV file
    const filename = `products_export_${formatDate(new Date())}.csv`

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'エクスポートに失敗しました' },
      { status: 500 }
    )
  }
}

// Escape CSV values (handle commas, quotes, newlines)
function escapeCSV(value: string): string {
  if (!value) return ''

  // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// Format date for filename (YYYYMMDD)
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}
