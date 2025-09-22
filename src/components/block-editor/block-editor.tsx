'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Type, 
  FileText, 
  List, 
  CheckSquare, 
  Code, 
  Image,
  Link,
  Quote,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react'

interface Block {
  id: string
  type: 'paragraph' | 'heading' | 'list' | 'checklist' | 'code' | 'image' | 'quote' | 'link'
  content: string
  metadata?: any
  order: number
}

interface BlockEditorProps {
  initialBlocks?: Block[]
  onBlocksChange?: (blocks: Block[]) => void
  placeholder?: string
  className?: string
}

export default function BlockEditor({ 
  initialBlocks = [], 
  onBlocksChange, 
  placeholder = "Start typing...",
  className = "" 
}: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialBlocks.length > 0) {
      setBlocks(initialBlocks)
    }
  }, [initialBlocks])

  useEffect(() => {
    onBlocksChange?.(blocks)
  }, [blocks, onBlocksChange])

  const addBlock = (type: Block['type'] = 'paragraph', index?: number) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: '',
      order: index !== undefined ? index : blocks.length
    }

    const newBlocks = [...blocks]
    if (index !== undefined) {
      newBlocks.splice(index, 0, newBlock)
      // Update order for all blocks
      newBlocks.forEach((block, i) => block.order = i)
    } else {
      newBlocks.push(newBlock)
    }

    setBlocks(newBlocks)
  }

  const updateBlock = (id: string, content: string, metadata?: any) => {
    setBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, content, metadata } : block
    ))
  }

  const deleteBlock = (id: string) => {
    if (blocks.length === 1) return // Keep at least one block
    setBlocks(prev => prev.filter(block => block.id !== id))
  }

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks]
    const [movedBlock] = newBlocks.splice(fromIndex, 1)
    newBlocks.splice(toIndex, 0, movedBlock)
    
    // Update order
    newBlocks.forEach((block, i) => block.order = i)
    setBlocks(newBlocks)
  }

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlock(blockId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault()
    setIsDraggingOver(blockId)
  }

  const handleDrop = (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault()
    
    if (draggedBlock && draggedBlock !== targetBlockId) {
      const fromIndex = blocks.findIndex(b => b.id === draggedBlock)
      const toIndex = blocks.findIndex(b => b.id === targetBlockId)
      
      if (fromIndex !== -1 && toIndex !== -1) {
        moveBlock(fromIndex, toIndex)
      }
    }
    
    setDraggedBlock(null)
    setIsDraggingOver(null)
  }

  const handleDragEnd = () => {
    setDraggedBlock(null)
    setIsDraggingOver(null)
  }

  const renderBlock = (block: Block, index: number) => {
    const isDragged = draggedBlock === block.id
    const isDragTarget = isDraggingOver === block.id

    const commonProps = {
      key: block.id,
      draggable: true,
      onDragStart: (e: React.DragEvent) => handleDragStart(e, block.id),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, block.id),
      onDrop: (e: React.DragEvent) => handleDrop(e, block.id),
      onDragEnd: handleDragEnd,
      className: `transition-all duration-200 ${
        isDragged ? 'opacity-50 scale-95' : ''
      } ${isDragTarget ? 'ring-2 ring-blue-500' : ''}`
    }

    switch (block.type) {
      case 'heading':
        return (
          <Card {...commonProps} className="mb-2 border-l-4 border-l-blue-500">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <Select 
                  value={block.metadata?.level || 'h2'} 
                  onValueChange={(level) => updateBlock(block.id, block.content, { ...block.metadata, level })}
                >
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="h1">H1</SelectItem>
                    <SelectItem value="h2">H2</SelectItem>
                    <SelectItem value="h3">H3</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => deleteBlock(block.id)}
                  className="ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value, block.metadata)}
                placeholder="Heading..."
                className={`font-bold ${
                  block.metadata?.level === 'h1' ? 'text-2xl' :
                  block.metadata?.level === 'h2' ? 'text-xl' : 'text-lg'
                }`}
              />
            </CardContent>
          </Card>
        )

      case 'list':
        return (
          <Card {...commonProps} className="mb-2 border-l-4 border-l-green-500">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <Badge variant="outline">List</Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => deleteBlock(block.id)}
                  className="ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value, block.metadata)}
                placeholder="List item..."
                className="min-h-[60px]"
              />
            </CardContent>
          </Card>
        )

      case 'checklist':
        return (
          <Card {...commonProps} className="mb-2 border-l-4 border-l-yellow-500">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <Badge variant="outline">Checklist</Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => deleteBlock(block.id)}
                  className="ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {block.content.split('\n').map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={block.metadata?.checked?.[i] || false}
                      onChange={(e) => {
                        const checked = block.metadata?.checked || []
                        checked[i] = e.target.checked
                        updateBlock(block.id, block.content, { ...block.metadata, checked })
                      }}
                      className="rounded"
                    />
                    <Input
                      value={item}
                      onChange={(e) => {
                        const lines = block.content.split('\n')
                        lines[i] = e.target.value
                        updateBlock(block.id, lines.join('\n'), block.metadata)
                      }}
                      placeholder="Checklist item..."
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case 'code':
        return (
          <Card {...commonProps} className="mb-2 border-l-4 border-l-purple-500">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <Badge variant="outline">Code</Badge>
                <Select 
                  value={block.metadata?.language || 'plaintext'} 
                  onValueChange={(language) => updateBlock(block.id, block.content, { ...block.metadata, language })}
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plaintext">Plain Text</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="css">CSS</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => deleteBlock(block.id)}
                  className="ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value, block.metadata)}
                placeholder="Code..."
                className="min-h-[100px] font-mono text-sm bg-muted"
              />
            </CardContent>
          </Card>
        )

      case 'quote':
        return (
          <Card {...commonProps} className="mb-2 border-l-4 border-l-gray-500">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <Badge variant="outline">Quote</Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => deleteBlock(block.id)}
                  className="ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value, block.metadata)}
                placeholder="Quote..."
                className="min-h-[80px] italic"
              />
            </CardContent>
          </Card>
        )

      case 'link':
        return (
          <Card {...commonProps} className="mb-2 border-l-4 border-l-blue-500">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <Badge variant="outline">Link</Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => deleteBlock(block.id)}
                  className="ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Input
                  value={block.metadata?.title || ''}
                  onChange={(e) => updateBlock(block.id, block.content, { ...block.metadata, title: e.target.value })}
                  placeholder="Link title..."
                />
                <Input
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, e.target.value, block.metadata)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        )

      default: // paragraph
        return (
          <Card {...commonProps} className="mb-2">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <Badge variant="outline">Text</Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => deleteBlock(block.id)}
                  className="ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value, block.metadata)}
                placeholder={placeholder}
                className="min-h-[60px] resize-none"
              />
            </CardContent>
          </Card>
        )
    }
  }

  const BlockTypeButton = ({ type, icon, label }: { 
    type: Block['type'], 
    icon: React.ReactNode, 
    label: string 
  }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => addBlock(type)}
      className="flex items-center gap-2"
    >
      {icon}
      {label}
    </Button>
  )

  return (
    <div className={`space-y-4 ${className}`} ref={editorRef}>
      {/* Block Type Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <BlockTypeButton
              type="paragraph"
              icon={<Type className="h-4 w-4" />}
              label="Text"
            />
            <BlockTypeButton
              type="heading"
              icon={<Heading2 className="h-4 w-4" />}
              label="Heading"
            />
            <BlockTypeButton
              type="list"
              icon={<List className="h-4 w-4" />}
              label="List"
            />
            <BlockTypeButton
              type="checklist"
              icon={<CheckSquare className="h-4 w-4" />}
              label="Checklist"
            />
            <BlockTypeButton
              type="code"
              icon={<Code className="h-4 w-4" />}
              label="Code"
            />
            <BlockTypeButton
              type="quote"
              icon={<Quote className="h-4 w-4" />}
              label="Quote"
            />
            <BlockTypeButton
              type="link"
              icon={<Link className="h-4 w-4" />}
              label="Link"
            />
          </div>
        </CardContent>
      </Card>

      {/* Blocks Container */}
      <div className="space-y-2">
        {blocks.map((block, index) => (
          <div key={block.id}>
            {renderBlock(block, index)}
            {/* Add block button between blocks */}
            <div className="flex justify-center my-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addBlock('paragraph', index + 1)}
                className="opacity-0 hover:opacity-100 transition-opacity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {blocks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Start creating content</p>
            <Button onClick={() => addBlock('paragraph')}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first block
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}