import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET - Fetch single product
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
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id }
    })
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    const body = await request.json()
    
    // Validate price and stock if provided
    if (body.price !== undefined && parseFloat(body.price) <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      )
    }
    
    if (body.stock !== undefined && parseInt(body.stock) < 0) {
      return NextResponse.json(
        { error: 'Stock cannot be negative' },
        { status: 400 }
      )
    }
    
    // Prepare update data
    const updateData: Prisma.ProductUpdateInput = {};
    const bodyKeys: (keyof typeof body)[] = [
      'name', 'nameJa', 'description', 'cardSet', 'cardNumber',
      'rarity', 'condition', 'language', 'foil', 'firstEdition',
      'graded', 'gradingCompany', 'grade', 'featured', 'published',
      'lowStock', 'price', 'comparePrice', 'stock'
    ];

    bodyKeys.forEach(key => {
      if (body[key] !== undefined) {
        if (key === 'price' || key === 'comparePrice') {
          (updateData as any)[key] = body[key] ? parseFloat(body[key]) : null;
        } else if (key === 'stock' || key === 'lowStock') {
          (updateData as any)[key] = parseInt(body[key], 10);
        } else {
          (updateData as any)[key] = body[key];
        }
      }
    });
    
    // Update product
    const product = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
        images: true
      }
    })
    
    return NextResponse.json(product)
    
  } catch (error: unknown) {
    console.error('Error updating product:', error)
    
    if (error instanceof Error && (error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Product with this SKU or slug already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        orderItems: true
      }
    })
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // Check if product is in any orders
    if (product.orderItems.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete product that has been ordered',
          suggestion: 'Consider marking it as unpublished instead'
        },
        { status: 409 }
      )
    }
    
    // Delete product (cascade deletes images, tags, cart items, wishlist items)
    await prisma.product.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    )
    
  } catch (error: unknown) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
