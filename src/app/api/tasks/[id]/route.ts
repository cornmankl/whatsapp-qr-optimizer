import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const task = await db.task.findUnique({
      where: { id: params.id },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        project: true
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { title, description, status, priority, dueDate, projectId, tagIds } = body

    const updateData: any = {
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId
    }

    const task = await db.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        project: true
      }
    })

    // Update tags if provided
    if (tagIds !== undefined) {
      // Remove existing tags
      await db.taskTag.deleteMany({
        where: { taskId: params.id }
      })

      // Add new tags
      if (tagIds.length > 0) {
        for (const tagId of tagIds) {
          await db.taskTag.create({
            data: {
              taskId: params.id,
              tagId
            }
          })
        }
      }
    }

    // Refetch to include updated tags
    const updatedTask = await db.task.findUnique({
      where: { id: params.id },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        project: true
      }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.taskTag.deleteMany({
      where: { taskId: params.id }
    })

    await db.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}