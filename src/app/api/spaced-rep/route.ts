import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const dueOnly = searchParams.get('dueOnly') === 'true'

    const where: any = {}
    
    if (type) where.type = type
    if (dueOnly) {
      where.nextReview = {
        lte: new Date()
      }
    }

    const spacedReps = await db.spacedRep.findMany({
      where,
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: [
        { nextReview: 'asc' },
        { difficulty: 'desc' }
      ]
    })

    return NextResponse.json(spacedReps)
  } catch (error) {
    console.error('Error fetching spaced repetition items:', error)
    return NextResponse.json({ error: 'Failed to fetch spaced repetition items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, type, difficulty } = body

    // Calculate initial next review date (start with 1 day from now)
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + 1)

    const spacedRep = await db.spacedRep.create({
      data: {
        title,
        content,
        type: type || 'QUESTION',
        difficulty: difficulty || 3,
        interval: 1,
        easeFactor: 2.5,
        nextReview,
        userId: 'default-user' // In a real app, this would come from authentication
      },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    return NextResponse.json(spacedRep, { status: 201 })
  } catch (error) {
    console.error('Error creating spaced repetition item:', error)
    return NextResponse.json({ error: 'Failed to create spaced repetition item' }, { status: 500 })
  }
}