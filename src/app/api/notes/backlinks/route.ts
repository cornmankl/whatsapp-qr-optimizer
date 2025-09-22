import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title')

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Find all notes that contain wiki links to the specified title
    const wikiLinkPattern = `\\[\\[${title}\\]\\]`

    const notes = await db.note.findMany({
      where: {
        OR: [
          {
            title: {
              contains: wikiLinkPattern,
              mode: 'insensitive'
            }
          },
          {
            content: {
              contains: wikiLinkPattern,
              mode: 'insensitive'
            }
          }
        ]
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    // Also check for links in tasks, projects, and spaced repetition items
    const tasks = await db.task.findMany({
      where: {
        OR: [
          {
            title: {
              contains: wikiLinkPattern,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: wikiLinkPattern,
              mode: 'insensitive'
            }
          }
        ]
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

    const projects = await db.project.findMany({
      where: {
        OR: [
          {
            name: {
              contains: wikiLinkPattern,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: wikiLinkPattern,
              mode: 'insensitive'
            }
          }
        ]
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        tasks: true,
        notes: {
          include: {
            note: true
          }
        }
      }
    })

    const spacedReps = await db.spacedRep.findMany({
      where: {
        OR: [
          {
            title: {
              contains: wikiLinkPattern,
              mode: 'insensitive'
            }
          },
          {
            content: {
              contains: wikiLinkPattern,
              mode: 'insensitive'
            }
          }
        ]
      },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    // Calculate link strength based on various factors
    const calculateLinkStrength = (item: any, linkCount: number): number => {
      let strength = 0.5 // Base strength
      
      // Increase strength based on link frequency
      strength += Math.min(linkCount * 0.1, 0.3)
      
      // Increase strength for recent items
      const daysSinceCreation = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceCreation < 7) strength += 0.2
      
      // Increase strength for items with tags
      if (item.tags && item.tags.length > 0) strength += 0.1
      
      // Increase strength for completed tasks or active projects
      if (item.status === 'DONE' || item.status === 'ACTIVE') strength += 0.1
      
      return Math.min(strength, 1.0)
    }

    // Format backlinks
    const backlinks = [
      ...notes.map(note => ({
        id: note.id,
        title: note.title,
        excerpt: note.content?.substring(0, 150) + '...' || '',
        type: 'note' as const,
        linkStrength: calculateLinkStrength(note, 1),
        createdAt: note.createdAt
      })),
      ...tasks.map(task => ({
        id: task.id,
        title: task.title,
        excerpt: task.description?.substring(0, 150) + '...' || '',
        type: 'task' as const,
        linkStrength: calculateLinkStrength(task, 1),
        createdAt: task.createdAt
      })),
      ...projects.map(project => ({
        id: project.id,
        title: project.name,
        excerpt: project.description?.substring(0, 150) + '...' || '',
        type: 'project' as const,
        linkStrength: calculateLinkStrength(project, 1),
        createdAt: project.createdAt
      })),
      ...spacedReps.map(spacedRep => ({
        id: spacedRep.id,
        title: spacedRep.title,
        excerpt: spacedRep.content.substring(0, 150) + '...',
        type: 'spaced-rep' as const,
        linkStrength: calculateLinkStrength(spacedRep, 1),
        createdAt: spacedRep.createdAt
      }))
    ]

    return NextResponse.json({
      backlinks: backlinks.sort((a, b) => b.linkStrength - a.linkStrength)
    })
  } catch (error) {
    console.error('Error fetching backlinks:', error)
    return NextResponse.json({ error: 'Failed to fetch backlinks' }, { status: 500 })
  }
}