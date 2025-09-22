import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const projectId = searchParams.get('projectId')

    const where: any = {}
    
    if (status) where.status = status
    if (priority) where.priority = priority
    if (projectId) where.projectId = projectId

    const tasks = await db.task.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        project: true
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, status, priority, dueDate, projectId, tagIds } = body

    const task = await db.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        userId: 'default-user' // In a real app, this would come from authentication
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        project: true
      }
    })

    // Add tags if provided
    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await db.taskTag.create({
          data: {
            taskId: task.id,
            tagId
          }
        })
      }
    }

    // Refetch to include tags
    const updatedTask = await db.task.findUnique({
      where: { id: task.id },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        project: true
      }
    })

    return NextResponse.json(updatedTask, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}