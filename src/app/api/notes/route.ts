import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const where: any = {}
    
    if (type) where.type = type
    if (status) where.status = status

    const notes = await db.note.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        projects: {
          include: {
            project: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, type, status, priority, tagIds, projectIds } = body

    const note = await db.note.create({
      data: {
        title,
        content,
        type: type || 'IDEA',
        status: status || 'DRAFT',
        priority: priority || 'MEDIUM',
        userId: 'default-user' // In a real app, this would come from authentication
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        projects: {
          include: {
            project: true
          }
        }
      }
    })

    // Add tags if provided
    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await db.noteTag.create({
          data: {
            noteId: note.id,
            tagId
          }
        })
      }
    }

    // Add projects if provided
    if (projectIds && projectIds.length > 0) {
      for (const projectId of projectIds) {
        await db.projectNote.create({
          data: {
            noteId: note.id,
            projectId
          }
        })
      }
    }

    // Refetch to include tags and projects
    const updatedNote = await db.note.findUnique({
      where: { id: note.id },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        projects: {
          include: {
            project: true
          }
        }
      }
    })

    return NextResponse.json(updatedNote, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}