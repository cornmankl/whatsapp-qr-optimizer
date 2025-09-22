import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { quality } = body // Quality: 0-5 (0=complete blackout, 5=perfect response)

    // Fetch the current spaced repetition item
    const spacedRep = await db.spacedRep.findUnique({
      where: { id: params.id },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!spacedRep) {
      return NextResponse.json({ error: 'Spaced repetition item not found' }, { status: 404 })
    }

    // SM-2 Algorithm implementation
    let easeFactor = spacedRep.easeFactor
    let interval = spacedRep.interval
    let nextReview = new Date()

    if (quality >= 3) {
      // Correct response
      if (spacedRep.reviewCount === 0) {
        interval = 1
      } else if (spacedRep.reviewCount === 1) {
        interval = 6
      } else {
        interval = Math.round(spacedRep.interval * easeFactor)
      }
      
      // Update ease factor
      easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
    } else {
      // Incorrect response - reset interval
      interval = 1
      easeFactor = Math.max(1.3, easeFactor - 0.2)
    }

    // Set next review date
    nextReview.setDate(nextReview.getDate() + interval)

    // Record the review
    const review = await db.spacedRepReview.create({
      data: {
        spacedRepId: params.id,
        quality,
        easeFactor,
        interval,
        nextReview,
        reviewTime: Math.floor((Date.now() - spacedRep.updatedAt.getTime()) / 1000) // Time since last review in seconds
      }
    })

    // Update the spaced repetition item
    const updatedSpacedRep = await db.spacedRep.update({
      where: { id: params.id },
      data: {
        easeFactor,
        interval,
        nextReview,
        reviewCount: spacedRep.reviewCount + 1
      },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    return NextResponse.json({
      spacedRep: updatedSpacedRep,
      review,
      nextReviewIn: interval
    })
  } catch (error) {
    console.error('Error reviewing spaced repetition item:', error)
    return NextResponse.json({ error: 'Failed to review spaced repetition item' }, { status: 500 })
  }
}