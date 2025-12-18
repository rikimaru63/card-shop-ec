import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSKU, generateUniqueSlug } from '@/lib/utils/sku'
import { Prisma } from '@prisma/client'
import { isAdminAuthorized } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const published = searchParams.get('published')
    
    const where: Prisma.ProductWhereInput = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (published !== null) {
      where.published = published === 'true'
    }
    
    const skip = (page - 1) * limit
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          category: true,
          images: { take: 1 }
        }
      }),
      prisma.product.count({ where })
    ])
    
    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Error fetching admin products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.price || body.stock === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, price, stock' },
        { status: 400 }
      )
    }
    
    // Validate price and stock
    if (parseFloat(body.price) <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      )
    }
    
    if (parseInt(body.stock) < 0) {
      return NextResponse.json(
        { error: 'Stock cannot be negative' },
        { status: 400 }
      )
    }
    
    // Get or create Pokemon Cards category
    let category = await prisma.category.findFirst({
      where: { slug: 'pokemon-cards' }
    })
    
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Pokemon Cards',
          slug: 'pokemon-cards',
          description: 'Pokemon Trading Card Game cards'
        }
      })
    }
    
    // Generate SKU and slug
    const sku = body.sku || generateSKU(body.cardSet, body.cardNumber)
    const slug = await generateUniqueSlug(body.name, prisma)
    
    // Convert rarity and condition strings to enum values
    const rarityMap: { [key: string]: string } = {
      'C (コモン)': 'COMMON',
      'U (アンコモン)': 'UNCOMMON',
      'R (レア)': 'RARE',
      'RR (ダブルレア)': 'RARE',
      'RRR (トリプルレア)': 'SUPER_RARE',
      'SR (スーパーレア)': 'SUPER_RARE',
      'UR (ウルトラレア)': 'ULTRA_RARE',
      'SAR (スペシャルアートレア)': 'SECRET_RARE',
      'AR (アートレア)': 'SECRET_RARE',
      'CHR (キャラクターレア)': 'SECRET_RARE',
      'プロモ': 'PROMO',
      'RR': 'RARE',
      'SAR': 'SECRET_RARE',
      'UR': 'ULTRA_RARE',
      'SR': 'SUPER_RARE',
      'AR': 'SECRET_RARE'
    }
    
    const conditionMap: { [key: string]: string } = {
      'S (完美品)': 'MINT',
      'A (極美品)': 'NEAR_MINT',
      'B (美品)': 'LIGHTLY_PLAYED',
      'C (良好)': 'MODERATELY_PLAYED',
      'D (並品)': 'HEAVILY_PLAYED',
      'E (劣化品)': 'DAMAGED',
      'Mint': 'MINT',
      'Near Mint': 'NEAR_MINT',
      'MINT': 'MINT',
      'NEAR_MINT': 'NEAR_MINT'
    }
    
    const rarity = body.rarity ? rarityMap[body.rarity] || body.rarity : null
    const condition = body.condition ? conditionMap[body.condition] || body.condition : null
    
    // Create product
    const product = await prisma.product.create({
      data: {
        sku,
        slug,
        name: body.name,
        nameJa: body.nameJa,
        description: body.description,
        cardSet: body.cardSet,
        cardNumber: body.cardNumber,
        rarity,
        condition,
        language: body.language || 'EN',
        foil: body.foil === true || body.foil === 'true',
        firstEdition: body.firstEdition === true || body.firstEdition === 'true',
        graded: body.graded === true || body.graded === 'true',
        gradingCompany: body.gradingCompany && body.gradingCompany !== 'なし' ? body.gradingCompany : null,
        grade: body.grade,
        price: parseFloat(body.price),
        comparePrice: body.comparePrice ? parseFloat(body.comparePrice) : null,
        stock: parseInt(body.stock),
        lowStock: body.lowStock || 5,
        featured: body.featured || false,
        published: body.published !== false,
        categoryId: category.id
      },
      include: {
        category: true
      }
    })
    
    return NextResponse.json(product, { status: 201 })
    
  } catch (error: unknown) {
    console.error('Error creating product:', error)
    
    // Handle unique constraint violations
    if (error instanceof Error && (error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Product with this SKU or slug already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
