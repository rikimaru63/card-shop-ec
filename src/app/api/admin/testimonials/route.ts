import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthorized } from '@/lib/admin-auth'

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { displayOrder: 'asc' },
    })
    return NextResponse.json(testimonials)
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await isAdminAuthorized(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { customerName, content, imageUrl, rating, isVisible, displayOrder } = body

    if (!customerName || !content) {
      return NextResponse.json({ error: 'Customer name and content are required' }, { status: 400 })
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        customerName,
        content,
        imageUrl: imageUrl || null,
        rating: Math.min(5, Math.max(1, rating || 5)),
        isVisible: isVisible ?? true,
        displayOrder: displayOrder ?? 0,
      },
    })

    return NextResponse.json(testimonial, { status: 201 })
  } catch (error) {
    console.error('Error creating testimonial:', error)
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 })
  }
}
