import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Get active announcements (public)
export async function GET() {
  try {
    const now = new Date()

    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          // No date restrictions
          {
            startDate: null,
            endDate: null
          },
          // Within date range
          {
            startDate: { lte: now },
            endDate: { gte: now }
          },
          // Only start date
          {
            startDate: { lte: now },
            endDate: null
          },
          // Only end date
          {
            startDate: null,
            endDate: { gte: now }
          }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json([], { status: 200 })
  }
}
