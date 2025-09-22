import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    
    if (status) where.status = status

    const projects = await db.project.findMany({
      where,
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
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, status, priority, startDate, endDate, tagIds } = body

    const project = await db.project.create({
      data: {
        name,
        description,
        status: status || 'PLANNING',
        priority: priority || 'MEDIUM',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        userId: 'default-user' // In a real app, this would come from authentication
      },
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

    // Add tags if provided
    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await db.projectTag.create({
          data: {
            projectId: project.id,
            tagId
          }
        })
      }
    }

    // Refetch to include tags
    const updatedProject = await db.project.findUnique({
      where: { id: project.id },
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

    return NextResponse.json(updatedProject, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}