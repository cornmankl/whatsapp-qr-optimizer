import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() || ''
    const type = searchParams.get('type') // 'tasks', 'notes', 'projects', 'spaced-rep', or 'all'
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query.trim()) {
      return NextResponse.json({ results: [], total: 0 })
    }

    const results: any[] = []
    let total = 0

    // Search Tasks
    if (!type || type === 'all' || type === 'tasks') {
      const tasks = await db.task.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          tags: {
            include: {
              tag: true
            }
          },
          project: true
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      })

      tasks.forEach(task => {
        results.push({
          id: task.id,
          type: 'task',
          title: task.title,
          description: task.description,
          relevance: calculateRelevance(query, task.title, task.description),
          data: task,
          createdAt: task.createdAt
        })
      })
    }

    // Search Notes
    if (!type || type === 'all' || type === 'notes') {
      const notes = await db.note.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } }
          ]
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
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      })

      notes.forEach(note => {
        results.push({
          id: note.id,
          type: 'note',
          title: note.title,
          description: note.content,
          relevance: calculateRelevance(query, note.title, note.content),
          data: note,
          createdAt: note.createdAt
        })
      })
    }

    // Search Projects
    if (!type || type === 'all' || type === 'projects') {
      const projects = await db.project.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
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
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      })

      projects.forEach(project => {
        results.push({
          id: project.id,
          type: 'project',
          title: project.name,
          description: project.description,
          relevance: calculateRelevance(query, project.name, project.description),
          data: project,
          createdAt: project.createdAt
        })
      })
    }

    // Search Spaced Repetition Items
    if (!type || type === 'all' || type === 'spaced-rep') {
      const spacedReps = await db.spacedRep.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      })

      spacedReps.forEach(spacedRep => {
        results.push({
          id: spacedRep.id,
          type: 'spaced-rep',
          title: spacedRep.title,
          description: spacedRep.content,
          relevance: calculateRelevance(query, spacedRep.title, spacedRep.content),
          data: spacedRep,
          createdAt: spacedRep.createdAt
        })
      })
    }

    // Sort by relevance and limit results
    const sortedResults = results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)

    total = results.length

    return NextResponse.json({
      results: sortedResults,
      total,
      query,
      type: type || 'all'
    })
  } catch (error) {
    console.error('Error performing search:', error)
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 })
  }
}

function calculateRelevance(query: string, title: string, description: string | null): number {
  let score = 0
  
  // Exact title match gets highest score
  if (title.toLowerCase() === query) {
    score += 100
  }
  
  // Title contains query
  if (title.toLowerCase().includes(query)) {
    score += 50
  }
  
  // Description contains query
  if (description && description.toLowerCase().includes(query)) {
    score += 25
  }
  
  // Word matches in title
  const queryWords = query.toLowerCase().split(' ')
  const titleWords = title.toLowerCase().split(' ')
  const descWords = description ? description.toLowerCase().split(' ') : []
  
  queryWords.forEach(queryWord => {
    titleWords.forEach(titleWord => {
      if (titleWord === queryWord) {
        score += 10
      }
    })
    
    descWords.forEach(descWord => {
      if (descWord === queryWord) {
        score += 5
      }
    })
  })
  
  return score
}