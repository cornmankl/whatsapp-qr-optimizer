import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const project = await db.project.findUnique({
      where: { id: params.id },
      include: {
        tasks: true,
        notes: {
          include: {
            note: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, description, status, priority, startDate, endDate, tagIds } = body

    const updateData: any = {
      name,
      description,
      status,
      priority,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    }

    const project = await db.project.update({
      where: { id: params.id },
      data: updateData,
      include: {
        tasks: true,
        notes: {
          include: {
            note: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    // Update tags if provided
    if (tagIds !== undefined) {
      // Remove existing tags
      await db.projectTag.deleteMany({
        where: { projectId: params.id }
      })

      // Add new tags
      if (tagIds.length > 0) {
        for (const tagId of tagIds) {
          await db.projectTag.create({
            data: {
              projectId: params.id,
              tagId
            }
          })
        }
      }
    }

    // Refetch to include updated tags
    const updatedProject = await db.project.findUnique({
      where: { id: params.id },
      include: {
        tasks: true,
        notes: {
          include: {
            note: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Delete related records first
    await db.projectTag.deleteMany({
      where: { projectId: params.id }
    })
    
    await db.projectNote.deleteMany({
      where: { projectId: params.id }
    })

    // Update tasks to remove project reference
    await db.task.updateMany({
      where: { projectId: params.id },
      data: { projectId: null }
    })

    await db.project.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}