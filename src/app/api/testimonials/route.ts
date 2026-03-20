import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isVisible: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        customerName: true,
        content: true,
        imageUrl: true,
        rating: true,
        displayOrder: true,
      },
    })
    return NextResponse.json(testimonials)
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 })
  }
}
