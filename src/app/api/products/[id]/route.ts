import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        images: {
          orderBy: { order: 'asc' }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // Calculate average rating
    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0
    
    // Format response
    const formattedProduct = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      nameJa: product.nameJa,
      slug: product.slug,
      description: product.description,
      cardSet: product.cardSet,
      cardNumber: product.cardNumber,
      rarity: product.rarity,
      condition: product.condition,
      language: product.language,
      foil: product.foil,
      firstEdition: product.firstEdition,
      graded: product.graded,
      gradingCompany: product.gradingCompany,
      grade: product.grade,
      price: product.price.toNumber(),
      comparePrice: product.comparePrice?.toNumber(),
      stock: product.stock,
      lowStock: product.stock <= product.lowStock,
      trackStock: product.trackStock,
      featured: product.featured,
      published: product.published,
      category: product.category,
      images: product.images.map(img => ({
        id: img.id,
        url: img.url,
        alt: img.alt
      })),
      reviews: product.reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        verified: review.verified,
        createdAt: review.createdAt,
        user: review.user
      })),
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: product.reviews.length,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }
    
    return NextResponse.json(formattedProduct)
    
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
