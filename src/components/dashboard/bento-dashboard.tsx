'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Brain, 
  FolderOpen, 
  Clock, 
  FileText, 
  Target, 
  Network, 
  MessageSquare, 
  Sparkles,
  TrendingUp,
  Calendar,
  Users,
  Zap,
  BarChart3,
  Plus,
  ArrowRight
} from 'lucide-react'
import MagicBento from '@/components/ui/magic-bento'
import KnowledgeGraph from '@/components/knowledge-graph/knowledge-graph'
import WhatsAppBotManager from '@/components/whatsapp/whatsapp-bot-manager'

interface DashboardStats {
  activeTasks: number
  dueToday: number
  ideasIncubating: number
  readyToDevelop: number
  activeProjects: number
  needsAttention: number
  reviewsDue: number
  spacedRep: number
  whatsappConnected: boolean
  totalNotes: number
  recentActivity: number
}

interface RecentItem {
  id: string
  type: 'task' | 'note' | 'project' | 'review'
  title: string
  description: string
  priority?: 'high' | 'medium' | 'low'
  dueDate?: string
  status: string
  createdAt: string
}

export default function BentoDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeTasks: 12,
    dueToday: 3,
    ideasIncubating: 24,
    readyToDevelop: 5,
    activeProjects: 3,
    needsAttention: 1,
    reviewsDue: 8,
    spacedRep: 15,
    whatsappConnected: false,
    totalNotes: 156,
    recentActivity: 23
  })

  const [recentItems, setRecentItems] = useState<RecentItem[]>([
    {
      id: '1',
      type: 'task',
      title: 'Complete project proposal',
      description: 'Finalize Q4 project proposal and budget',
      priority: 'high',
      dueDate: '2024-01-15',
      status: 'In Progress',
      createdAt: '2024-01-14T10:30:00Z'
    },
    {
      id: '2',
      type: 'note',
      title: 'AI Integration Ideas',
      description: 'Brainstorming session notes for AI features',
      status: 'Draft',
      createdAt: '2024-01-14T09:15:00Z'
    },
    {
      id: '3',
      type: 'project',
      title: 'Mobile App Redesign',
      description: 'Complete UI/UX overhaul for mobile application',
      priority: 'medium',
      status: 'Planning',
      createdAt: '2024-01-13T14:20:00Z'
    },
    {
      id: '4',
      type: 'review',
      title: 'JavaScript Concepts',
      description: 'Review advanced JavaScript patterns and concepts',
      status: 'Scheduled',
      createdAt: '2024-01-13T11:45:00Z'
    }
  ])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckCircle className="h-4 w-4" />
      case 'note': return <FileText className="h-4 w-4" />
      case 'project': return <FolderOpen className="h-4 w-4" />
      case 'review': return <Brain className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task': return 'text-green-600 bg-green-50 border-green-200'
      case 'note': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'project': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'review': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tasks Card */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTasks}</div>
            <p className="text-xs text-muted-foreground">{stats.dueToday} due today</p>
            <div className="mt-2">
              <Progress value={(stats.dueToday / stats.activeTasks) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Notes & Ideas Card */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notes & Ideas</CardTitle>
            <Brain className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ideasIncubating}</div>
            <p className="text-xs text-muted-foreground">{stats.readyToDevelop} ready to develop</p>
            <div className="mt-2">
              <Progress value={(stats.readyToDevelop / stats.ideasIncubating) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Projects Card */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">{stats.needsAttention} needs attention</p>
            <div className="mt-2">
              <Progress value={(stats.needsAttention / stats.activeProjects) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Learn Card */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learn</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviewsDue}</div>
            <p className="text-xs text-muted-foreground">{stats.spacedRep} for spaced repetition</p>
            <div className="mt-2">
              <Progress value={(stats.reviewsDue / stats.spacedRep) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity - 2x1 */}
        <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest updates across all categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentItems.map((item) => (
                <div key={item.id} className="flex items-start space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{item.title}</h4>
                    <p className="text-xs text-muted-foreground truncate mt-1">{item.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                      {item.priority && (
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </Badge>
                      )}
                      {item.dueDate && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Activity
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* WhatsApp Bot - 1x1 */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              WhatsApp Bot
            </CardTitle>
            <CardDescription>Control your second brain from anywhere</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Connection Status</span>
              <Badge variant={stats.whatsappConnected ? "default" : "secondary"}>
                {stats.whatsappConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Connect WhatsApp to manage tasks and notes via chat
              </p>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Connect Bot
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Graph Preview - 2x1 */}
        <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Knowledge Graph
            </CardTitle>
            <CardDescription>Visualize your learning connections and insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Network className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <p className="text-sm text-muted-foreground mb-4">
                  Interactive knowledge graph showing connections between your notes, tasks, and ideas
                </p>
                <Button variant="outline">
                  Explore Graph
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - 1x1 */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Fast access to common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Plus className="h-4 w-4 mr-2" />
              Quick Capture
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              Team Dashboard
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Magic Bento Feature Showcase */}
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
    </div>
  )
}