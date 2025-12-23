import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Reverse condition mapping
const conditionToString: { [key: string]: string } = {
  'GRADE_A': 'A',
  'GRADE_B': 'B',
  'GRADE_C': 'C',
  'PSA': 'PSA',
  'SEALED': '未開封',
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Create CSV content
    const header = 'namae,kosuu,kakaku,codition,categori'
    const rows = products.map(product => {
      const name = escapeCSV(product.name)
      const stock = product.stock
      const price = Number(product.price)
      const condition = conditionToString[product.condition || 'GRADE_A'] || 'A'
      const category = escapeCSV(product.category?.name || '')

      return `${name},${stock},${price},${condition},${category}`
    })

    const csv = [header, ...rows].join('\n')

    // Return as downloadable file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="products_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'エクスポート中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

// Escape CSV special characters
function escapeCSV(value: string): string {
  if (!value) return ''
  // If value contains comma, quote, or newline, wrap in quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
