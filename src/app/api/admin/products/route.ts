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
