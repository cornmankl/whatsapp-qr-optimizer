'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter, 
  Search,
  Maximize2,
  Download,
  Settings
} from 'lucide-react'

interface GraphNode {
  id: string
  title: string
  type: 'note' | 'task' | 'project' | 'spaced-rep'
  x: number
  y: number
  vx: number
  vy: number
  fx?: number | null
  fy?: number | null
  radius: number
  color: string
  linkCount: number
  createdAt: string
}

interface GraphLink {
  source: string
  target: string
  type: 'wiki-link' | 'tag' | 'project' | 'reference'
  strength: number
}

interface KnowledgeGraphProps {
  width?: number
  height?: number
  onNodeClick?: (node: GraphNode) => void
  onNodeHover?: (node: GraphNode | null) => void
}

export default function KnowledgeGraph({ 
  width = 800, 
  height = 600, 
  onNodeClick, 
  onNodeHover 
}: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragNode, setDragNode] = useState<GraphNode | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSimulating, setIsSimulating] = useState(true)

  useEffect(() => {
    loadGraphData()
  }, [])

  useEffect(() => {
    if (isSimulating) {
      startSimulation()
    }
  }, [isSimulating, nodes, links])

  const loadGraphData = async () => {
    try {
      // Load nodes from all content types
      const [notes, tasks, projects, spacedReps] = await Promise.all([
        fetch('/api/notes').then(r => r.json()),
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/spaced-rep').then(r => r.json())
      ])

      const graphNodes: GraphNode[] = []
      const graphLinks: GraphLink[] = []

      // Add nodes
      notes.forEach((note: any) => {
        graphNodes.push(createNode(note, 'note'))
      })
      tasks.forEach((task: any) => {
        graphNodes.push(createNode(task, 'task'))
      })
      projects.forEach((project: any) => {
        graphNodes.push(createNode(project, 'project'))
      })
      spacedReps.forEach((spacedRep: any) => {
        graphNodes.push(createNode(spacedRep, 'spaced-rep'))
      })

      // Extract wiki links and create connections
      graphNodes.forEach(node => {
        const wikiLinks = extractWikiLinks(node.title + ' ' + getNodeContent(node))
        wikiLinks.forEach(linkText => {
          const targetNode = graphNodes.find(n => 
            n.title.toLowerCase() === linkText.toLowerCase()
          )
          if (targetNode && targetNode.id !== node.id) {
            graphLinks.push({
              source: node.id,
              target: targetNode.id,
              type: 'wiki-link',
              strength: 0.8
            })
          }
        })
      })

      // Add tag-based connections
      const tagConnections = new Map<string, string[]>()
      graphNodes.forEach(node => {
        if (node.type === 'note') {
          // Mock tags for now - in real implementation, load from API
          const tags = getMockTags(node.id)
          tags.forEach(tag => {
            if (!tagConnections.has(tag)) {
              tagConnections.set(tag, [])
            }
            tagConnections.get(tag)!.push(node.id)
          })
        }
      })

      tagConnections.forEach((nodeIds, tag) => {
        for (let i = 0; i < nodeIds.length; i++) {
          for (let j = i + 1; j < nodeIds.length; j++) {
            graphLinks.push({
              source: nodeIds[i],
              target: nodeIds[j],
              type: 'tag',
              strength: 0.5
            })
          }
        }
      })

      setNodes(graphNodes)
      setLinks(graphLinks)
    } catch (error) {
      console.error('Error loading graph data:', error)
    }
  }

  const createNode = (item: any, type: string): GraphNode => {
    const colors = {
      note: '#3b82f6',
      task: '#10b981',
      project: '#8b5cf6',
      'spaced-rep': '#f59e0b'
    }

    return {
      id: item.id,
      title: type === 'project' ? item.name : item.title,
      type: type as any,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      radius: Math.max(20, Math.min(40, 20 + Math.random() * 20)),
      color: colors[type as keyof typeof colors],
      linkCount: 0,
      createdAt: item.createdAt
    }
  }

  const extractWikiLinks = (content: string): string[] => {
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g
    const links: string[] = []
    let match
    
    while ((match = wikiLinkRegex.exec(content)) !== null) {
      links.push(match[1])
    }
    
    return [...new Set(links)]
  }

  const getNodeContent = (node: GraphNode): string => {
    // Mock content - in real implementation, this would come from the node data
    return `Content for ${node.title}`
  }

  const getMockTags = (nodeId: string): string[] => {
    // Mock tags - in real implementation, load from API
    const tagMap: Record<string, string[]> = {
      '1': ['productivity', 'learning'],
      '2': ['development', 'coding'],
      '3': ['design', 'ui'],
      '4': ['research', 'analysis']
    }
    return tagMap[nodeId] || []
  }

  const startSimulation = () => {
    if (!isSimulating) return

    const simulation = () => {
      setNodes(prevNodes => {
        const newNodes = [...prevNodes]
        
        // Apply forces
        for (let i = 0; i < newNodes.length; i++) {
          const node = newNodes[i]
          
          // Skip if node is being dragged
          if (node.fx !== null || node.fy !== null) continue
          
          // Repulsion force between nodes
          for (let j = 0; j < newNodes.length; j++) {
            if (i === j) continue
            const other = newNodes[j]
            const dx = node.x - other.x
            const dy = node.y - other.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const minDistance = node.radius + other.radius + 50
            
            if (distance < minDistance && distance > 0) {
              const force = (minDistance - distance) / distance * 0.1
              node.vx += dx * force
              node.vy += dy * force
            }
          }
          
          // Attraction force for linked nodes
          links.forEach(link => {
            let sourceNode, targetNode
            if (link.source === node.id) {
              sourceNode = node
              targetNode = newNodes.find(n => n.id === link.target)
            } else if (link.target === node.id) {
              sourceNode = newNodes.find(n => n.id === link.source)
              targetNode = node
            }
            
            if (sourceNode && targetNode) {
              const dx = targetNode.x - sourceNode.x
              const dy = targetNode.y - sourceNode.y
              const distance = Math.sqrt(dx * dx + dy * dy)
              const idealDistance = 150
              
              if (distance > 0) {
                const force = (distance - idealDistance) / distance * 0.01 * link.strength
                sourceNode.vx += dx * force
                sourceNode.vy += dy * force
                targetNode.vx -= dx * force
                targetNode.vy -= dy * force
              }
            }
          })
          
          // Center gravity
          const centerX = width / 2
          const centerY = height / 2
          const centerDx = centerX - node.x
          const centerDy = centerY - node.y
          const centerDistance = Math.sqrt(centerDx * centerDx + centerDy * centerDy)
          
          if (centerDistance > 0) {
            const centerForce = centerDistance * 0.0001
            node.vx += centerDx * centerForce
            node.vy += centerDy * centerForce
          }
          
          // Apply velocity with damping
          node.vx *= 0.9
          node.vy *= 0.9
          node.x += node.vx
          node.y += node.vy
          
          // Keep nodes within bounds
          node.x = Math.max(node.radius, Math.min(width - node.radius, node.x))
          node.y = Math.max(node.radius, Math.min(height - node.radius, node.y))
        }
        
        return newNodes
      })
      
      if (isSimulating) {
        requestAnimationFrame(simulation)
      }
    }
    
    requestAnimationFrame(simulation)
  }

  const drawGraph = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Apply transformations
    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.scale(scale, scale)
    
    // Draw links
    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source)
      const targetNode = nodes.find(n => n.id === link.target)
      
      if (sourceNode && targetNode) {
        ctx.beginPath()
        ctx.moveTo(sourceNode.x, sourceNode.y)
        ctx.lineTo(targetNode.x, targetNode.y)
        
        // Style based on link type
        switch (link.type) {
          case 'wiki-link':
            ctx.strokeStyle = '#3b82f6'
            ctx.lineWidth = 2
            break
          case 'tag':
            ctx.strokeStyle = '#10b981'
            ctx.lineWidth = 1
            ctx.setLineDash([5, 5])
            break
          default:
            ctx.strokeStyle = '#6b7280'
            ctx.lineWidth = 1
        }
        
        ctx.globalAlpha = link.strength
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 1
      }
    })
    
    // Draw nodes
    nodes.forEach(node => {
      const isFiltered = filter !== 'all' && node.type !== filter
      const isSearched = searchQuery && !node.title.toLowerCase().includes(searchQuery.toLowerCase())
      
      if (isFiltered || isSearched) {
        ctx.globalAlpha = 0.3
      } else {
        ctx.globalAlpha = 1
      }
      
      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI)
      ctx.fillStyle = node.color
      ctx.fill()
      
      // Node border
      if (node === selectedNode || node === hoveredNode) {
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.stroke()
      }
      
      // Node label
      ctx.fillStyle = '#ffffff'
      ctx.font = `${Math.max(10, node.radius / 3)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Truncate text if too long
      const maxWidth = node.radius * 1.5
      const text = node.title
      const truncatedText = text.length > 15 ? text.substring(0, 12) + '...' : text
      
      ctx.fillText(truncatedText, node.x, node.y)
    })
    
    ctx.restore()
  }

  useEffect(() => {
    drawGraph()
  }, [nodes, links, selectedNode, hoveredNode, scale, offset, filter, searchQuery])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left - offset.x) / scale
    const y = (event.clientY - rect.top - offset.y) / scale
    
    // Find clicked node
    const clickedNode = nodes.find(node => {
      const dx = x - node.x
      const dy = y - node.y
      return Math.sqrt(dx * dx + dy * dy) <= node.radius
    })
    
    if (clickedNode) {
      setSelectedNode(clickedNode)
      onNodeClick?.(clickedNode)
    } else {
      setSelectedNode(null)
    }
  }

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left - offset.x) / scale
    const y = (event.clientY - rect.top - offset.y) / scale
    
    // Find hovered node
    const hovered = nodes.find(node => {
      const dx = x - node.x
      const dy = y - node.y
      return Math.sqrt(dx * dx + dy * dy) <= node.radius
    })
    
    setHoveredNode(hovered || null)
    onNodeHover?.(hovered || null)
    
    if (isDragging && dragNode) {
      dragNode.fx = x
      dragNode.fy = y
    }
  }

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left - offset.x) / scale
    const y = (event.clientY - rect.top - offset.y) / scale
    
    const clickedNode = nodes.find(node => {
      const dx = x - node.x
      const dy = y - node.y
      return Math.sqrt(dx * dx + dy * dy) <= node.radius
    })
    
    if (clickedNode) {
      setIsDragging(true)
      setDragNode(clickedNode)
      clickedNode.fx = x
      clickedNode.fy = y
    }
  }

  const handleCanvasMouseUp = () => {
    if (isDragging && dragNode) {
      dragNode.fx = null
      dragNode.fy = null
    }
    setIsDragging(false)
    setDragNode(null)
  }

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const delta = event.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.max(0.1, Math.min(3, prev * delta)))
  }

  const resetView = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
    setSelectedNode(null)
    setHoveredNode(null)
  }

  const exportGraph = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const link = document.createElement('a')
    link.download = 'knowledge-graph.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Knowledge Graph Visualization
          </CardTitle>
          <CardDescription>
            Interactive visualization of your knowledge connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="note">Notes</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                  <SelectItem value="project">Projects</SelectItem>
                  <SelectItem value="spaced-rep">Learning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSimulating(!isSimulating)}
              >
                {isSimulating ? 'Pause' : 'Play'}
              </Button>
              
              <Button variant="outline" size="sm" onClick={resetView}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={exportGraph}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graph Canvas */}
      <Card>
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="border cursor-pointer"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseDown={handleCanvasMouseDown}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleWheel}
          />
        </CardContent>
      </Card>

      {/* Node Details */}
      {(selectedNode || hoveredNode) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedNode?.title || hoveredNode?.title}
            </CardTitle>
            <CardDescription>
              <Badge variant="outline">
                {selectedNode?.type || hoveredNode?.type}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Connections</div>
                <div className="font-medium">
                  {links.filter(l => l.source === (selectedNode || hoveredNode)?.id || l.target === (selectedNode || hoveredNode)?.id).length}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Created</div>
                <div className="font-medium">
                  {(selectedNode || hoveredNode)?.createdAt ? new Date((selectedNode || hoveredNode)!.createdAt).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>Notes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span>Projects</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span>Learning</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}