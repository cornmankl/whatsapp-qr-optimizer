'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Brain, CheckCircle, FolderOpen, Clock, FileText, Calendar, Target, Network, MessageSquare, Sparkles } from 'lucide-react'
import KnowledgeGraph from '@/components/knowledge-graph/knowledge-graph'
import WhatsAppBotManager from '@/components/whatsapp/whatsapp-bot-manager'
import MagicBento from '@/components/ui/magic-bento'

interface SearchResult {
  id: string
  type: string
  title: string
  description: string | null
  relevance: number
  data: any
  createdAt: string
}

export default function SecondBrain() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false)
  const [quickTaskTitle, setQuickTaskTitle] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [whatsappStatus, setWhatsappStatus] = useState({ connected: false })

  const handleQuickCapture = () => {
    if (quickTaskTitle.trim()) {
      // Here you would typically save the task to your database
      console.log('Quick capture task:', quickTaskTitle)
      setQuickTaskTitle('')
      setIsQuickCaptureOpen(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()
      setSearchResults(data.results || [])
      setShowSearchResults(true)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircle className="h-4 w-4" />
      case 'note':
        return <FileText className="h-4 w-4" />
      case 'project':
        return <FolderOpen className="h-4 w-4" />
      case 'spaced-rep':
        return <Brain className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'text-green-600'
      case 'note':
        return 'text-blue-600'
      case 'project':
        return 'text-purple-600'
      case 'spaced-rep':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Second Brain</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your second brain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                  onFocus={() => setShowSearchResults(searchResults.length > 0)}
                />
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-2 border-b">
                      <p className="text-sm font-medium text-muted-foreground">
                        {searchResults.length} results found
                      </p>
                    </div>
                    {searchResults.map((result) => (
                      <div
                        key={`${result.type}-${result.id}`}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setShowSearchResults(false)
                          setSearchQuery('')
                          // Navigate to the appropriate tab based on type
                          switch (result.type) {
                            case 'task':
                              setActiveTab('tasks')
                              break
                            case 'note':
                              setActiveTab('notes')
                              break
                            case 'project':
                              setActiveTab('projects')
                              break
                            case 'spaced-rep':
                              setActiveTab('learn')
                              break
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={getTypeColor(result.type)}>
                            {getTypeIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{result.title}</h4>
                            {result.description && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {result.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {result.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(result.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isSearching && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 p-4">
                    <p className="text-sm text-muted-foreground">Searching...</p>
                  </div>
                )}
              </div>
              <Dialog open={isQuickCaptureOpen} onOpenChange={setIsQuickCaptureOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Quick Capture
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Quick Capture</DialogTitle>
                    <DialogDescription>
                      Quickly capture a task, idea, or note before you forget it.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="quick-task">Task / Idea</Label>
                      <Input
                        id="quick-task"
                        placeholder="What do you need to remember?"
                        value={quickTaskTitle}
                        onChange={(e) => setQuickTaskTitle(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleQuickCapture()}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quick-type">Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="task">Task</SelectItem>
                          <SelectItem value="idea">Idea</SelectItem>
                          <SelectItem value="note">Note</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsQuickCaptureOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleQuickCapture}>
                      Capture
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="notes">Notes & Ideas</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="learn">Learn</TabsTrigger>
            <TabsTrigger value="graph">Knowledge Graph</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp Bot</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">3 due today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ideas Incubating</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground">5 ready to develop</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">1 needs attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reviews Due</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">For spaced repetition</p>
                </CardContent>
              </Card>
            </div>

            {/* MagicBento Feature Showcase */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Advanced Features
                </CardTitle>
                <CardDescription>
                  Experience the power of Second Brain with our cutting-edge features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <MagicBento 
                    textAutoHide={true}
                    enableStars={true}
                    enableSpotlight={true}
                    enableBorderGlow={true}
                    enableTilt={true}
                    clickEffect={true}
                    enableMagnetism={true}
                    spotlightRadius={300}
                    particleCount={12}
                    glowColor="132, 0, 255"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Tasks</CardTitle>
                  <CardDescription>Your latest task updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Complete project proposal</p>
                      <p className="text-xs text-muted-foreground">Due in 2 hours</p>
                    </div>
                    <Badge variant="secondary">High</Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Review documentation</p>
                      <p className="text-xs text-muted-foreground">In progress</p>
                    </div>
                    <Badge variant="outline">Medium</Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Research new technologies</p>
                      <p className="text-xs text-muted-foreground">Due tomorrow</p>
                    </div>
                    <Badge variant="outline">Low</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ideas Incubating</CardTitle>
                  <CardDescription>Concepts developing in your second brain</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">AI-powered task automation</p>
                      <p className="text-xs text-muted-foreground">3 days old</p>
                    </div>
                    <Badge variant="secondary">Idea</Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Knowledge graph visualization</p>
                      <p className="text-xs text-muted-foreground">1 week old</p>
                    </div>
                    <Badge variant="outline">Insight</Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Mobile app design patterns</p>
                      <p className="text-xs text-muted-foreground">2 weeks old</p>
                    </div>
                    <Badge variant="outline">Reference</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
                <p className="text-muted-foreground">Capture and organize your tasks</p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>

            {/* Task Filters */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Status:</label>
                <select className="px-3 py-1 border rounded-md text-sm">
                  <option value="">All</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Priority:</label>
                <select className="px-3 py-1 border rounded-md text-sm">
                  <option value="">All</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <input type="checkbox" className="w-4 h-4" />
                  <div>
                    <h3 className="font-medium">Complete project proposal</h3>
                    <p className="text-sm text-muted-foreground">Finalize the Q4 project proposal and budget</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="destructive">Urgent</Badge>
                      <Badge variant="outline">Work</Badge>
                      <span className="text-xs text-muted-foreground">Due in 2 hours</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm">Delete</Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <input type="checkbox" className="w-4 h-4" />
                  <div>
                    <h3 className="font-medium">Review documentation</h3>
                    <p className="text-sm text-muted-foreground">Go through the new API documentation</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary">Medium</Badge>
                      <Badge variant="outline">Learning</Badge>
                      <span className="text-xs text-muted-foreground">In progress</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm">Delete</Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <input type="checkbox" className="w-4 h-4" />
                  <div>
                    <h3 className="font-medium">Research new technologies</h3>
                    <p className="text-sm text-muted-foreground">Look into new frameworks for the project</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">Low</Badge>
                      <Badge variant="outline">Research</Badge>
                      <span className="text-xs text-muted-foreground">Due tomorrow</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm">Delete</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Notes & Ideas</h2>
                <p className="text-muted-foreground">Your knowledge repository and idea incubator</p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>

            {/* Idea Incubation Filters */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Type:</label>
                <select className="px-3 py-1 border rounded-md text-sm">
                  <option value="">All</option>
                  <option value="IDEA">Ideas</option>
                  <option value="NOTE">Notes</option>
                  <option value="INSIGHT">Insights</option>
                  <option value="REFERENCE">References</option>
                  <option value="QUESTION">Questions</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Status:</label>
                <select className="px-3 py-1 border rounded-md text-sm">
                  <option value="">All</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INCUBATING">Incubating</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Idea Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">AI-powered task automation</CardTitle>
                    <Badge variant="secondary">Idea</Badge>
                  </div>
                  <CardDescription>3 days old • Incubating</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create an intelligent system that automatically categorizes and prioritizes tasks based on user behavior patterns and deadlines.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">AI</Badge>
                    <Badge variant="outline" className="text-xs">Automation</Badge>
                    <Badge variant="outline" className="text-xs">Productivity</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs text-muted-foreground">Developing</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm">Link</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insight Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Knowledge graph visualization</CardTitle>
                    <Badge variant="default">Insight</Badge>
                  </div>
                  <CardDescription>1 week old • Active</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Visualizing connections between notes and ideas could reveal hidden patterns and accelerate learning.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">Visualization</Badge>
                    <Badge variant="outline" className="text-xs">Knowledge</Badge>
                    <Badge variant="outline" className="text-xs">Graph</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-muted-foreground">Ready to develop</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm">Link</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reference Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Mobile app design patterns</CardTitle>
                    <Badge variant="outline">Reference</Badge>
                  </div>
                  <CardDescription>2 weeks old • Active</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Collection of modern mobile app UI/UX patterns and best practices from leading applications.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">Design</Badge>
                    <Badge variant="outline" className="text-xs">Mobile</Badge>
                    <Badge variant="outline" className="text-xs">UI/UX</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-muted-foreground">Reference material</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm">Link</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Question Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">How to implement spaced repetition?</CardTitle>
                    <Badge variant="destructive">Question</Badge>
                  </div>
                  <CardDescription>5 days old • Incubating</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    What are the best algorithms for implementing spaced repetition in a second brain system?
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">Learning</Badge>
                    <Badge variant="outline" className="text-xs">Algorithm</Badge>
                    <Badge variant="outline" className="text-xs">Research</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-xs text-muted-foreground">Needs research</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm">Link</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Note Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Meeting notes - Product strategy</CardTitle>
                    <Badge variant="secondary">Note</Badge>
                  </div>
                  <CardDescription>1 day old • Draft</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Discussed Q4 product roadmap, focusing on AI integration and user experience improvements.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">Meeting</Badge>
                    <Badge variant="outline" className="text-xs">Strategy</Badge>
                    <Badge variant="outline" className="text-xs">Planning</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      <span className="text-xs text-muted-foreground">Draft</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm">Link</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
                <p className="text-muted-foreground">Manage your project pipelines</p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>

            {/* Project Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Planning Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground">Planning</h3>
                  <Badge variant="outline">1</Badge>
                </div>
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Website Redesign</CardTitle>
                      <Badge variant="secondary">Medium</Badge>
                    </div>
                    <CardDescription className="text-xs">New project • Planning</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Complete overhaul of company website with modern design and improved UX.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Tasks:</span>
                        <span>0/5</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress:</span>
                        <span>0%</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      <Badge variant="outline" className="text-xs">Design</Badge>
                      <Badge variant="outline" className="text-xs">Web</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground">Active</h3>
                  <Badge variant="outline">1</Badge>
                </div>
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Mobile App Development</CardTitle>
                      <Badge variant="default">High</Badge>
                    </div>
                    <CardDescription className="text-xs">In progress • 60% complete</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Developing iOS and Android apps for customer engagement platform.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Tasks:</span>
                        <span>6/10</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress:</span>
                        <span>60%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      <Badge variant="outline" className="text-xs">Mobile</Badge>
                      <Badge variant="outline" className="text-xs">React Native</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* On Hold Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground">On Hold</h3>
                  <Badge variant="outline">0</Badge>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No projects on hold</p>
                </div>
              </div>

              {/* Completed Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground">Completed</h3>
                  <Badge variant="outline">1</Badge>
                </div>
                <Card className="border-l-4 border-l-gray-400 opacity-75">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">API Integration</CardTitle>
                      <Badge variant="outline">Low</Badge>
                    </div>
                    <CardDescription className="text-xs">Completed • 100% complete</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Integrated third-party APIs for enhanced functionality.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Tasks:</span>
                        <span>8/8</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress:</span>
                        <span>100%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gray-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      <Badge variant="outline" className="text-xs">Backend</Badge>
                      <Badge variant="outline" className="text-xs">API</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Project Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Projects</p>
                      <p className="text-2xl font-bold">3</p>
                    </div>
                    <FolderOpen className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Tasks</p>
                      <p className="text-2xl font-bold">14</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <p className="text-2xl font-bold">67%</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-sm font-bold">✓</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Overdue</p>
                      <p className="text-2xl font-bold">1</p>
                    </div>
                    <Clock className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Learn Tab */}
          <TabsContent value="learn" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Spaced Repetition</h2>
                <p className="text-muted-foreground">Reinforce your learning with spaced repetition</p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {/* Learning Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Due Today</p>
                      <p className="text-2xl font-bold">8</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Items</p>
                      <p className="text-2xl font-bold">45</p>
                    </div>
                    <Brain className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Mastery Rate</p>
                      <p className="text-2xl font-bold">78%</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-sm font-bold">✓</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Interval</p>
                      <p className="text-2xl font-bold">12d</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 text-sm font-bold">📅</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Spaced Repetition Filters */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Type:</label>
                <select className="px-3 py-1 border rounded-md text-sm">
                  <option value="">All</option>
                  <option value="QUESTION">Questions</option>
                  <option value="FACT">Facts</option>
                  <option value="CONCEPT">Concepts</option>
                  <option value="PROCEDURE">Procedures</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Show:</label>
                <select className="px-3 py-1 border rounded-md text-sm">
                  <option value="due">Due Now</option>
                  <option value="all">All Items</option>
                  <option value="new">New</option>
                  <option value="learning">Learning</option>
                </select>
              </div>
            </div>

            {/* Review Queue */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Items Due for Review</h3>
              
              {/* Review Card 1 */}
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>What is the spacing effect in learning?</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive">Question</Badge>
                      <Badge variant="outline">Due now</Badge>
                    </div>
                  </div>
                  <CardDescription>Psychology • Learning Science • Review 3</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">
                        The spacing effect is the phenomenon whereby learning is greater when studying is spread out over time 
                        rather than concentrated into shorter study sessions.
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <span>Current interval: 4 days • Ease factor: 2.3</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Again</Button>
                        <Button variant="outline" size="sm">Hard</Button>
                        <Button variant="outline" size="sm">Good</Button>
                        <Button variant="default" size="sm">Easy</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Review Card 2 */}
              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Explain the SM-2 algorithm</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">Concept</Badge>
                      <Badge variant="outline">Due now</Badge>
                    </div>
                  </div>
                  <CardDescription>Algorithms • Spaced Repetition • Review 5</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">
                        SM-2 is a spaced repetition algorithm that calculates review intervals based on user performance 
                        quality, adjusting ease factors and intervals to optimize learning efficiency.
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <span>Current interval: 12 days • Ease factor: 2.7</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Again</Button>
                        <Button variant="outline" size="sm">Hard</Button>
                        <Button variant="outline" size="sm">Good</Button>
                        <Button variant="default" size="sm">Easy</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Review Card 3 */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>How to implement React Context API?</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Procedure</Badge>
                      <Badge variant="outline">Due now</Badge>
                    </div>
                  </div>
                  <CardDescription>React • Frontend • Review 2</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">
                        1. Create a context with React.createContext()<br/>
                        2. Create a provider component<br/>
                        3. Wrap components with the provider<br/>
                        4. Use useContext hook to consume the context
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <span>Current interval: 2 days • Ease factor: 2.5</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Again</Button>
                        <Button variant="outline" size="sm">Hard</Button>
                        <Button variant="outline" size="sm">Good</Button>
                        <Button variant="default" size="sm">Easy</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Reviews */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Upcoming Reviews</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">HTTP Status Codes</h4>
                      <Badge variant="outline">Fact</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Due in 2 days</p>
                    <p className="text-sm text-muted-foreground">Common HTTP status codes and their meanings...</p>
                  </CardContent>
                </Card>
                
                <Card className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">CSS Grid Layout</h4>
                      <Badge variant="outline">Concept</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Due in 5 days</p>
                    <p className="text-sm text-muted-foreground">Understanding CSS Grid and its properties...</p>
                  </CardContent>
                </Card>
                
                <Card className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">Git Workflow</h4>
                      <Badge variant="outline">Procedure</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Due in 1 week</p>
                    <p className="text-sm text-muted-foreground">Best practices for Git branching and merging...</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Knowledge Graph Tab */}
          <TabsContent value="graph" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Knowledge Graph</h2>
                <p className="text-muted-foreground">Visualize connections and relationships in your knowledge base</p>
              </div>
              <Button>
                <Network className="h-4 w-4 mr-2" />
                Export Graph
              </Button>
            </div>

            {/* Knowledge Graph Visualization */}
            <KnowledgeGraph 
              width={1000}
              height={600}
              onNodeClick={(node) => {
                console.log('Node clicked:', node)
                // Navigate to appropriate tab based on node type
                switch (node.type) {
                  case 'task':
                    setActiveTab('tasks')
                    break
                  case 'note':
                    setActiveTab('notes')
                    break
                  case 'project':
                    setActiveTab('projects')
                    break
                  case 'spaced-rep':
                    setActiveTab('learn')
                    break
                }
              }}
              onNodeHover={(node) => {
                console.log('Node hovered:', node)
              }}
            />
          </TabsContent>

          {/* WhatsApp Bot Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">WhatsApp Bot</h2>
                <p className="text-muted-foreground">Manage your Second Brain WhatsApp Assistant</p>
              </div>
              <Badge variant={whatsappStatus.connected ? "default" : "secondary"}>
                {whatsappStatus.connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <WhatsAppBotManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}