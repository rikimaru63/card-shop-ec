import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    const product = await prisma.product.findUnique({
      where: {
        id: id
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        images: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Format response to match the frontend expectation
    const formattedProduct = {
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
      stock: product.stock,
      lowStock: product.stock <= product.lowStock,
      images: product.images.map(img => img.url),
      category: product.category.name, // Or slug, depending on usage
      language: product.language,
      foil: product.foil,
      firstEdition: product.firstEdition,
      graded: product.graded,
      gradingCompany: product.gradingCompany,
      grade: product.grade,
      featured: product.featured,
      description: product.description,
      // Add other fields if necessary, e.g. features, specifications (if stored in JSON)
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
