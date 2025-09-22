import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const note = await db.note.findUnique({
      where: { id: params.id },
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
        },
        links: {
          include: {
            toNote: true
          }
        },
        linkedFrom: {
          include: {
            fromNote: true
          }
        }
      }
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error fetching note:', error)
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { title, content, type, status, priority, tagIds, projectIds } = body

    const updateData: any = {
      title,
      content,
      type,
      status,
      priority
    }

    const note = await db.note.update({
      where: { id: params.id },
      data: updateData,
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

    // Update tags if provided
    if (tagIds !== undefined) {
      // Remove existing tags
      await db.noteTag.deleteMany({
        where: { noteId: params.id }
      })

      // Add new tags
      if (tagIds.length > 0) {
        for (const tagId of tagIds) {
          await db.noteTag.create({
            data: {
              noteId: params.id,
              tagId
            }
          })
        }
      }
    }

    // Update projects if provided
    if (projectIds !== undefined) {
      // Remove existing projects
      await db.projectNote.deleteMany({
        where: { noteId: params.id }
      })

      // Add new projects
      if (projectIds.length > 0) {
        for (const projectId of projectIds) {
          await db.projectNote.create({
            data: {
              noteId: params.id,
              projectId
            }
          })
        }
      }
    }

    // Refetch to include updated relations
    const updatedNote = await db.note.findUnique({
      where: { id: params.id },
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

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Delete related records first
    await db.noteTag.deleteMany({
      where: { noteId: params.id }
    })
    
    await db.projectNote.deleteMany({
      where: { noteId: params.id }
    })
    
    await db.noteLink.deleteMany({
      where: {
        OR: [
          { fromNoteId: params.id },
          { toNoteId: params.id }
        ]
      }
    })

    await db.note.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}