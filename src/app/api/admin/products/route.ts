import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
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

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Existing filters
    const search = searchParams.get('search')
    const published = searchParams.get('published')

    // New filters - aligned with public /api/products
    const game = searchParams.get('game')
    const rarity = searchParams.get('rarity')
    const condition = searchParams.get('condition')
    const cardSet = searchParams.get('cardSet')
    const productType = searchParams.get('productType')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const inStock = searchParams.get('inStock')
    const sortBy = searchParams.get('sortBy') || 'sortOrder'

    const where: Prisma.ProductWhereInput = {}

    // Search filter (name, cardNumber, sku)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameJa: { contains: search, mode: 'insensitive' } },
        { cardNumber: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Published filter
    if (published === 'true' || published === 'false') {
      where.published = published === 'true'
    }

    // Game filter (maps to category slug)
    if (game) {
      if (game === 'pokemon') {
        where.category = { slug: 'pokemon-cards' }
      } else if (game === 'onepiece') {
        where.category = { slug: 'onepiece-cards' }
      } else if (game === 'other') {
        where.category = { slug: 'other-cards' }
      }
    }

    // Rarity filter (supports comma-separated)
    if (rarity) {
      const rarities = rarity.split(',').filter(Boolean)
      if (rarities.length === 1) {
        where.rarity = rarities[0]
      } else if (rarities.length > 1) {
        where.rarity = { in: rarities }
      }
    }

    // Condition filter (supports comma-separated)
    if (condition) {
      const conditions = condition.split(',').filter(Boolean)
      if (conditions.length === 1) {
        where.condition = conditions[0] as any
      } else if (conditions.length > 1) {
        where.condition = { in: conditions as any }
      }
    }

    // Card set filter (supports comma-separated, partial matching)
    if (cardSet) {
      const cardSets = cardSet.split(',').filter(Boolean)
      if (cardSets.length === 1) {
        where.cardSet = { contains: cardSets[0] }
      } else if (cardSets.length > 1) {
        if (!where.AND) where.AND = []
        ;(where.AND as Prisma.ProductWhereInput[]).push({
          OR: cardSets.map(cs => ({ cardSet: { contains: cs } }))
        })
      }
    }

    // Product type filter
    if (productType) {
      where.productType = productType as any
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    // In stock filter
    if (inStock === 'true') {
      where.stock = { gt: 0 }
    }

    // Sort order
    let orderBy: Prisma.ProductOrderByWithRelationInput[] = [
      { sortOrder: 'asc' },
      { createdAt: 'desc' }
    ]
    switch (sortBy) {
      case 'newest':
        orderBy = [{ createdAt: 'desc' }]
        break
      case 'oldest':
        orderBy = [{ createdAt: 'asc' }]
        break
      case 'price-asc':
        orderBy = [{ price: 'asc' }]
        break
      case 'price-desc':
        orderBy = [{ price: 'desc' }]
        break
      case 'name-asc':
        orderBy = [{ name: 'asc' }]
        break
      case 'stock-asc':
        orderBy = [{ stock: 'asc' }]
        break
      case 'stock-desc':
        orderBy = [{ stock: 'desc' }]
        break
      // default 'sortOrder' keeps the manual drag order
    }

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          images: { take: 1, orderBy: { order: 'asc' } }
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
    
    // Get or create category based on categoryId (slug)
    const categorySlug = body.categoryId || 'pokemon-cards'
    let category = await prisma.category.findFirst({
      where: { slug: categorySlug }
    })

    if (!category) {
      // Create category based on slug
      const categoryData: { [key: string]: { name: string; description: string } } = {
        'pokemon-cards': {
          name: 'ポケモンカード',
          description: 'ポケモンカードゲームのシングルカード、BOX、パックなど'
        },
        'onepiece-cards': {
          name: 'ワンピースカード',
          description: 'ワンピースカードゲームのシングルカード、BOX、パックなど'
        }
      }
      const catInfo = categoryData[categorySlug] || categoryData['pokemon-cards']
      category = await prisma.category.create({
        data: {
          name: catInfo.name,
          slug: categorySlug,
          description: catInfo.description
        }
      })
    }
    
    // Generate SKU and slug
    const sku = body.sku || generateSKU(body.cardSet, body.cardNumber)
    const slug = await generateUniqueSlug(body.name, prisma)
    
    // Convert condition strings to enum values (rarity is now a string field)
    const conditionMap: { [key: string]: string } = {
      'A：美品': 'GRADE_A',
      'B：良品': 'GRADE_B',
      'C：ダメージ': 'GRADE_C',
      'GRADE_A': 'GRADE_A',
      'GRADE_B': 'GRADE_B',
      'GRADE_C': 'GRADE_C',
      'PSA': 'PSA',
      '未開封': 'SEALED',
      'SEALED': 'SEALED'
    }

    const rarity = body.rarity || null
    const condition = body.condition ? conditionMap[body.condition] || body.condition : null

    // Check for duplicate product (cardNumber + condition)
    if (body.cardNumber && condition) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          categoryId: category.id,
          cardSet: body.cardSet,
          cardNumber: body.cardNumber,
          condition: condition as any
        },
        select: {
          id: true,
          name: true,
          sku: true
        }
      })

      if (existingProduct) {
        return NextResponse.json(
          {
            error: 'この商品は既に登録されています',
            existingProduct: {
              id: existingProduct.id,
              name: existingProduct.name,
              sku: existingProduct.sku
            }
          },
          { status: 409 }
        )
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        sku,
        slug,
        name: body.name,
        nameJa: body.nameJa,
        description: body.description,
        productType: body.productType || 'SINGLE',
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
        hasShrink: body.hasShrink === true || body.hasShrink === 'true',
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

    // Revalidate cache for product pages
    revalidatePath('/admin/products')
    revalidatePath('/products')

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
