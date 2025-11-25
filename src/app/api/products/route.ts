import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, Rarity, Condition } from '@prisma/client'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const rarity = searchParams.get('rarity')
    const condition = searchParams.get('condition')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const cardSet = searchParams.get('cardSet')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const isNewArrival = searchParams.get('isNewArrival')
    const isRecommended = searchParams.get('isRecommended')

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      published: true
    }

    // Feature filters
    if (isNewArrival === 'true') {
      where.isNewArrival = true
    }
    if (isRecommended === 'true') {
      where.isRecommended = true
    }

    // Category filter
    if (category) {
      where.category = {
        slug: category
      }
    }

    // Rarity filter
    if (rarity) {
      where.rarity = rarity as Rarity
    }

    // Condition filter
    if (condition) {
      where.condition = condition as Condition
    }

    // Card set filter
    if (cardSet) {
      where.cardSet = cardSet
    }

    // Search filter (name or description)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameJa: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    // Determine sort order
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' } // Default: newest

    switch (sortBy) {
      case 'price-asc':
        orderBy = { price: 'asc' }
        break
      case 'price-desc':
        orderBy = { price: 'desc' }
        break
      case 'name-asc':
        orderBy = { name: 'asc' }
        break
      case 'popular':
        // Could order by number of reviews or sales
        orderBy = { createdAt: 'desc' }
        break
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute queries in parallel
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          images: {
            take: 1,
            orderBy: { order: 'asc' }
          }
        }
      }),
      prisma.product.count({ where })
    ])

    // Format response
    const formattedProducts = products.map(product => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      nameJa: product.nameJa,
      slug: product.slug,
      cardSet: product.cardSet,
      cardNumber: product.cardNumber,
      rarity: product.rarity,
      condition: product.condition,
      price: product.price.toNumber(),
      comparePrice: product.comparePrice?.toNumber(),
      previousPrice: product.previousPrice?.toNumber() || null,
      lastPriceChange: product.lastPriceChange?.toISOString() || null,
      stock: product.stock,
      lowStock: product.stock <= product.lowStock,
      image: product.images[0]?.url || '/placeholder-card.jpg',
      category: product.category,
      language: product.language,
      foil: product.foil,
      firstEdition: product.firstEdition,
      graded: product.graded,
      gradingCompany: product.gradingCompany,
      grade: product.grade,
      featured: product.featured,
      isNewArrival: product.isNewArrival,
      isRecommended: product.isRecommended
    }))

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    })

  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
