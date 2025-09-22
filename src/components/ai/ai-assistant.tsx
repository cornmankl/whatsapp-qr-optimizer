'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Brain, Sparkles, Tag, FileText, Lightbulb, HelpCircle, CheckSquare, MessageSquare } from 'lucide-react'

interface AIAssistantProps {
  onContentGenerated?: (content: string) => void
  onTagsGenerated?: (tags: string[]) => void
  onSummaryGenerated?: (summary: string) => void
}

export default function AIAssistant({ 
  onContentGenerated, 
  onTagsGenerated, 
  onSummaryGenerated 
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [isLoading, setIsLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState('content')
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([])
  const [chatInput, setChatInput] = useState('')

  const generateContent = async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          type: contentType,
          context: content 
        })
      })

      const data = await response.json()
      if (data.content) {
        onContentGenerated?.(data.content)
        setPrompt('')
        setContent('')
      }
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateTags = async () => {
    if (!content.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      const data = await response.json()
      if (data.tags) {
        onTagsGenerated?.(data.tags)
      }
    } catch (error) {
      console.error('Error generating tags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSummary = async () => {
    if (!content.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      const data = await response.json()
      if (data.summary) {
        onSummaryGenerated?.(data.summary)
      }
    } catch (error) {
      console.error('Error generating summary:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...chatMessages, userMessage],
          knowledgeBase: [] // Could be populated with relevant notes
        })
      })

      const data = await response.json()
      if (data.response) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      }
    } catch (error) {
      console.error('Error in chat:', error)
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error processing your request.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <Brain className="h-4 w-4 mr-2" />
          AI Assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Assistant
          </DialogTitle>
          <DialogDescription>
            Leverage AI to enhance your Second Brain with smart content generation, summarization, and insights.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="summarize" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Summarize
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <Card className="h-96">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">AI Chat Assistant</CardTitle>
                <CardDescription>
                  Ask questions about your knowledge, get help with organization, or request insights.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 h-full flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-3 bg-muted/50 p-3 rounded-lg">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Start a conversation with your AI assistant</p>
                    </div>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">Thinking...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendChatMessage()}
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={sendChatMessage} 
                    disabled={isLoading || !chatInput.trim()}
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Generation</CardTitle>
                <CardDescription>
                  Generate ideas, content, questions, or tasks using AI.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Generation Type</label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content">General Content</SelectItem>
                      <SelectItem value="ideas">Ideas</SelectItem>
                      <SelectItem value="questions">Questions</SelectItem>
                      <SelectItem value="tasks">Tasks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Prompt</label>
                  <Textarea
                    placeholder="What would you like to generate?"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Context (optional)</label>
                  <Textarea
                    placeholder="Additional context for better generation..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button 
                  onClick={generateContent} 
                  disabled={isLoading || !prompt.trim()}
                  className="w-full"
                >
                  {isLoading ? 'Generating...' : 'Generate Content'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tags" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Smart Tagging</CardTitle>
                <CardDescription>
                  Automatically generate relevant tags for your content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <Textarea
                    placeholder="Paste your content here to generate tags..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                  />
                </div>
                <Button 
                  onClick={generateTags} 
                  disabled={isLoading || !content.trim()}
                  className="w-full"
                >
                  {isLoading ? 'Generating Tags...' : 'Generate Tags'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summarize" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Smart Summarization</CardTitle>
                <CardDescription>
                  Generate concise summaries of your content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Content to Summarize</label>
                  <Textarea
                    placeholder="Paste your content here to summarize..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                  />
                </div>
                <Button 
                  onClick={generateSummary} 
                  disabled={isLoading || !content.trim()}
                  className="w-full"
                >
                  {isLoading ? 'Summarizing...' : 'Generate Summary'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}