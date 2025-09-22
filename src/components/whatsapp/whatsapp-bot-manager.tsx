'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import QRCodeDisplay from './qr-code-display'
import { 
  MessageSquare, 
  Smartphone, 
  Settings, 
  Wifi, 
  WifiOff, 
  Send, 
  Bell,
  Users,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  QrCode
} from 'lucide-react'

interface WhatsAppStatus {
  connected: boolean
  status: string
  sessionId: string
}

interface WhatsAppConfig {
  sessionId: string
  autoReply: boolean
  aiEnabled: boolean
  authorizedNumbers: string[]
}

interface SessionStats {
  total: number
  active: number
  inactive: number
  error: number
  oldestSession: string | null
  newestSession: string | null
}

export default function WhatsAppBotManager() {
  const [status, setStatus] = useState<WhatsAppStatus>({ connected: false, status: 'Not initialized', sessionId: 'default' })
  const [config, setConfig] = useState<WhatsAppConfig>({
    sessionId: 'default',
    autoReply: true,
    aiEnabled: true,
    authorizedNumbers: []
  })
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    total: 0,
    active: 0,
    inactive: 0,
    error: 0,
    oldestSession: null,
    newestSession: null
  })
  const [newNumber, setNewNumber] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [testNumber, setTestNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkStatus()
    loadSessionStats()
  }, [])

  const checkStatus = async () => {
    try {
      const response = await fetch(`/api/whatsapp?action=status&sessionId=${config.sessionId}`)
      const data = await response.json()
      if (data.success) {
        setStatus({
          connected: data.connected,
          status: data.status,
          sessionId: data.sessionId || config.sessionId
        })
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error)
    }
  }

  const loadSessionStats = async () => {
    try {
      const response = await fetch('/api/whatsapp?action=sessions')
      const data = await response.json()
      if (data.success) {
        setSessionStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading session stats:', error)
    }
  }

  const initializeBot = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/whatsapp?action=initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await response.json()
      if (data.success) {
        // Check status after a delay to allow connection
        setTimeout(() => {
          checkStatus()
          loadSessionStats()
        }, 2000)
      } else {
        setError('Failed to initialize bot: ' + data.error)
      }
    } catch (error) {
      console.error('Error initializing bot:', error)
      setError('Error initializing bot')
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectBot = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/whatsapp?action=disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: config.sessionId })
      })
      const data = await response.json()
      if (data.success) {
        setStatus({ connected: false, status: 'Disconnected', sessionId: config.sessionId })
        loadSessionStats()
      } else {
        setError('Failed to disconnect bot: ' + data.error)
      }
    } catch (error) {
      console.error('Error disconnecting bot:', error)
      setError('Error disconnecting bot')
    } finally {
      setIsLoading(false)
    }
  }

  const reinitializeBot = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/whatsapp?action=reinitialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await response.json()
      if (data.success) {
        // Check status after a delay to allow connection
        setTimeout(() => {
          checkStatus()
          loadSessionStats()
        }, 2000)
      } else {
        setError('Failed to reinitialize bot: ' + data.error)
      }
    } catch (error) {
      console.error('Error reinitializing bot:', error)
      setError('Error reinitializing bot')
    } finally {
      setIsLoading(false)
    }
  }

  const sendTestMessage = async () => {
    if (!testNumber || !testMessage) {
      alert('Please enter both number and message')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/whatsapp?action=send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: config.sessionId,
          jid: `${testNumber}@s.whatsapp.net`,
          message: testMessage
        })
      })
      const data = await response.json()
      if (data.success) {
        setTestMessage('')
        alert('Message sent successfully!')
      } else {
        alert('Failed to send message: ' + data.error)
      }
    } catch (error) {
      console.error('Error sending test message:', error)
      alert('Error sending test message')
    } finally {
      setIsLoading(false)
    }
  }

  const addAuthorizedNumber = () => {
    if (newNumber && !config.authorizedNumbers.includes(newNumber)) {
      setConfig(prev => ({
        ...prev,
        authorizedNumbers: [...prev.authorizedNumbers, newNumber]
      }))
      setNewNumber('')
    }
  }

  const removeAuthorizedNumber = (number: string) => {
    setConfig(prev => ({
      ...prev,
      authorizedNumbers: prev.authorizedNumbers.filter(n => n !== number)
    }))
  }

  const commandExamples = [
    { command: 'task create Belajar React Native', description: 'Create a new task' },
    { command: 'note create Idea untuk app baru', description: 'Create a new note' },
    { command: 'project create Website Company', description: 'Create a new project' },
    { command: 'search React', description: 'Search for content' },
    { command: 'ai Apa itu React?', description: 'Ask AI Assistant' },
    { command: 'status', description: 'Get system status' },
    { command: 'help', description: 'Show help' }
  ]

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            WhatsApp Bot Status
          </CardTitle>
          <CardDescription>
            Manage your Second Brain WhatsApp Bot connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {status.connected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">
                  Status: {status.connected ? 'Connected' : 'Disconnected'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {status.status} (Session: {status.sessionId})
                </p>
              </div>
            </div>
            
            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
                <div className="mt-2 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={reinitializeBot}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Reinitializing...' : 'Force Reinitialize'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex gap-2 flex-wrap">
              {!status.connected ? (
                <>
                  <Button onClick={initializeBot} disabled={isLoading}>
                    {isLoading ? 'Connecting...' : 'Connect Bot'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={reinitializeBot}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Reinitializing...' : 'Force Reinitialize'}
                  </Button>
                </>
              ) : (
                <Button variant="destructive" onClick={disconnectBot} disabled={isLoading}>
                  {isLoading ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              )}
              <Button variant="outline" onClick={checkStatus}>
                Refresh Status
              </Button>
            </div>
          </div>

          {/* Session Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{sessionStats.total}</div>
              <div className="text-xs text-muted-foreground">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{sessionStats.active}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{sessionStats.inactive}</div>
              <div className="text-xs text-muted-foreground">Inactive</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{sessionStats.error}</div>
              <div className="text-xs text-muted-foreground">Error</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {sessionStats.total > 0 ? Math.round((sessionStats.active / sessionStats.total) * 100) : 0}%
              </div>
              <div className="text-xs text-muted-foreground">Health</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="qr">QR Code</TabsTrigger>
          <TabsTrigger value="test">Test Bot</TabsTrigger>
          <TabsTrigger value="commands">Commands</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Bot Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionId">Session ID</Label>
                  <Input
                    id="sessionId"
                    value={config.sessionId}
                    onChange={(e) => setConfig(prev => ({ ...prev, sessionId: e.target.value }))}
                    placeholder="default"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Auto Reply</Label>
                  <Switch
                    checked={config.autoReply}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoReply: checked }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>AI Assistant</Label>
                  <Switch
                    checked={config.aiEnabled}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, aiEnabled: checked }))}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Authorized Numbers
                </Label>
                <div className="space-y-2 mt-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter phone number (e.g., 60123456789)"
                      value={newNumber}
                      onChange={(e) => setNewNumber(e.target.value)}
                    />
                    <Button onClick={addAuthorizedNumber}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {config.authorizedNumbers.map((number) => (
                      <Badge key={number} variant="secondary" className="flex items-center gap-1">
                        {number}
                        <button
                          onClick={() => removeAuthorizedNumber(number)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={initializeBot} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR Code Tab */}
        <TabsContent value="qr" className="space-y-4">
          <QRCodeDisplay 
            sessionId={config.sessionId}
            onQRScanned={() => {
              // Refresh status when QR is scanned
              setTimeout(() => checkStatus(), 2000)
            }}
            onConnectionStatusChange={(connected) => {
              setStatus(prev => ({
                ...prev,
                connected,
                status: connected ? 'Connected' : 'Disconnected'
              }))
            }}
          />
        </TabsContent>

        {/* Test Bot Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Test Bot
              </CardTitle>
              <CardDescription>
                Send a test message to verify the bot is working
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testNumber">Phone Number</Label>
                <Input
                  id="testNumber"
                  placeholder="60123456789"
                  value={testNumber}
                  onChange={(e) => setTestNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="testMessage">Message</Label>
                <Input
                  id="testMessage"
                  placeholder="Hello from Second Brain Bot!"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
              </div>
              <Button onClick={sendTestMessage} disabled={isLoading || !status.connected}>
                {isLoading ? 'Sending...' : 'Send Test Message'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commands Tab */}
        <TabsContent value="commands" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Available Commands
              </CardTitle>
              <CardDescription>
                All commands you can use via WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {commandExamples.map((example, index) => (
                  <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {example.command}
                      </code>
                      <p className="text-sm text-muted-foreground mt-1">
                        {example.description}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {example.command.split(' ')[0]}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure which events trigger WhatsApp notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Task Due Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when tasks are due
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Task Assigned</p>
                    <p className="text-sm text-muted-foreground">
                      Notify when new tasks are created
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Project Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Get updates on project progress
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AI Insights</p>
                    <p className="text-sm text-muted-foreground">
                      Receive AI-generated insights
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}