import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { customerName, content, imageUrl, rating, isVisible, displayOrder } = body

    const data: any = {}
    if (customerName !== undefined) data.customerName = customerName
    if (content !== undefined) data.content = content
    if (imageUrl !== undefined) data.imageUrl = imageUrl || null
    if (rating !== undefined) data.rating = Math.min(5, Math.max(1, rating))
    if (isVisible !== undefined) data.isVisible = isVisible
    if (displayOrder !== undefined) data.displayOrder = displayOrder

    const testimonial = await prisma.testimonial.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(testimonial)
  } catch (error) {
    console.error('Error updating testimonial:', error)
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.testimonial.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting testimonial:', error)
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 })
  }
}
