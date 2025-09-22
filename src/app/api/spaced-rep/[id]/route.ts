import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const spacedRep = await db.spacedRep.findUnique({
      where: { id: params.id },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!spacedRep) {
      return NextResponse.json({ error: 'Spaced repetition item not found' }, { status: 404 })
    }

    return NextResponse.json(spacedRep)
  } catch (error) {
    console.error('Error fetching spaced repetition item:', error)
    return NextResponse.json({ error: 'Failed to fetch spaced repetition item' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { title, content, type, difficulty } = body

    const updateData: any = {
      title,
      content,
      type,
      difficulty
    }

    const spacedRep = await db.spacedRep.update({
      where: { id: params.id },
      data: updateData,
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json(spacedRep)
  } catch (error) {
    console.error('Error updating spaced repetition item:', error)
    return NextResponse.json({ error: 'Failed to update spaced repetition item' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Delete reviews first
    await db.spacedRepReview.deleteMany({
      where: { spacedRepId: params.id }
    })

    await db.spacedRep.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Spaced repetition item deleted successfully' })
  } catch (error) {
    console.error('Error deleting spaced repetition item:', error)
    return NextResponse.json({ error: 'Failed to delete spaced repetition item' }, { status: 500 })
  }
}