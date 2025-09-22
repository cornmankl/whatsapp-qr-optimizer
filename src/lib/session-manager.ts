import fs from 'fs'
import path from 'path'
import WhatsAppBot from '@/lib/whatsapp/bot'
import NotificationService from '@/lib/notifications'

interface SessionData {
  id: string
  config: any
  status: 'active' | 'inactive' | 'error'
  lastActive: Date
  createdAt: Date
  metadata?: {
    phoneNumber?: string
    deviceName?: string
    platform?: string
  }
}

class SessionManager {
  private sessions: Map<string, { bot: WhatsAppBot; data: SessionData }> = new Map()
  private notificationService: NotificationService
  private sessionsDir: string
  private qrCache: Map<string, { qr: string; timestamp: Date }> = new Map()
  private preInitializedSessions: Set<string> = new Set()

  constructor() {
    this.sessionsDir = path.join(process.cwd(), 'whatsapp-sessions')
    this.notificationService = new NotificationService()
    this.ensureSessionsDirectory()
    this.loadExistingSessions()
    this.startSessionPooling()
  }

  // Pre-initialize common session IDs for faster access
  private startSessionPooling() {
    // Pre-initialize default session
    this.preInitializeSession('default')
    
    // Start periodic pre-initialization check
    setInterval(() => {
      this.preInitializeSession('default')
    }, 30000) // Every 30 seconds
  }

  private async preInitializeSession(sessionId: string): Promise<void> {
    if (this.preInitializedSessions.has(sessionId)) {
      return
    }

    try {
      const config = {
        sessionId,
        autoReply: true,
        aiEnabled: true,
        authorizedNumbers: []
      }

      const bot = new WhatsAppBot(config)
      bot.setSessionManager(this)
      
      // Pre-initialize without full connection
      await bot.preInitialize()
      
      // Store in sessions but mark as pre-initialized
      this.sessions.set(sessionId, {
        bot,
        data: {
          id: sessionId,
          config,
          status: 'inactive',
          lastActive: new Date(),
          createdAt: new Date()
        }
      })
      
      this.preInitializedSessions.add(sessionId)
      console.log(`Session ${sessionId} pre-initialized for faster QR generation`)
    } catch (error) {
      console.error(`Failed to pre-initialize session ${sessionId}:`, error)
    }
  }

  private ensureSessionsDirectory() {
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true })
    }
  }

  private loadExistingSessions() {
    try {
      const sessionFiles = fs.readdirSync(this.sessionsDir)
      
      for (const sessionFile of sessionFiles) {
        if (sessionFile.endsWith('.json')) {
          const sessionId = sessionFile.replace('.json', '')
          const sessionDataPath = path.join(this.sessionsDir, sessionFile)
          
          try {
            const sessionData = JSON.parse(fs.readFileSync(sessionDataPath, 'utf-8'))
            
            // Don't auto-start sessions, just register them
            this.sessions.set(sessionId, {
              bot: null as any, // Will be initialized when needed
              data: {
                ...sessionData,
                status: 'inactive',
                lastActive: new Date(sessionData.lastActive)
              }
            })
          } catch (error) {
            console.error(`Error loading session ${sessionId}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Error loading existing sessions:', error)
    }
  }

  async createSession(sessionId: string, config: any): Promise<WhatsAppBot> {
    try {
      // Check if session already exists
      if (this.sessions.has(sessionId)) {
        throw new Error('Session already exists')
      }

      // Create new bot instance
      const bot = new WhatsAppBot(config)
      bot.setSessionManager(this) // Set session manager reference
      
      // Pre-initialize the bot for faster QR generation
      await bot.preInitialize()
      
      this.notificationService.setBotInstance(bot)

      // Store session data
      const sessionData: SessionData = {
        id: sessionId,
        config,
        status: 'active',
        lastActive: new Date(),
        createdAt: new Date()
      }

      this.sessions.set(sessionId, { bot, data: sessionData })
      
      // Save session to file
      await this.saveSession(sessionId, sessionData)

      // Initialize bot
      await bot.initialize()

      return bot
    } catch (error) {
      console.error('Error creating session:', error)
      throw error
    }
  }

  async getSession(sessionId: string): Promise<WhatsAppBot | null> {
    const session = this.sessions.get(sessionId)
    
    if (!session) {
      return null
    }

    // If bot is not initialized, initialize it
    if (!session.bot) {
      try {
        const bot = new WhatsAppBot(session.data.config)
        bot.setSessionManager(this) // Set session manager reference
        
        // Pre-initialize for faster QR generation
        await bot.preInitialize()
        
        this.notificationService.setBotInstance(bot)
        await bot.initialize()
        
        session.bot = bot
        session.data.status = 'active'
        session.data.lastActive = new Date()
        
        await this.saveSession(sessionId, session.data)
      } catch (error) {
        console.error('Error initializing bot for session:', error)
        session.data.status = 'error'
        await this.saveSession(sessionId, session.data)
        return null
      }
    }

    return session.bot
  }

  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    
    if (!session) {
      return false
    }

    session.data = { ...session.data, ...updates, lastActive: new Date() }
    await this.saveSession(sessionId, session.data)
    
    return true
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    
    if (!session) {
      return false
    }

    try {
      // Disconnect bot if active
      if (session.bot) {
        await session.bot.disconnect()
      }

      // Remove session from memory
      this.sessions.delete(sessionId)

      // Remove session file
      const sessionFile = path.join(this.sessionsDir, `${sessionId}.json`)
      if (fs.existsSync(sessionFile)) {
        fs.unlinkSync(sessionFile)
      }

      // Remove session directory
      const sessionDir = path.join(this.sessionsDir, sessionId)
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true })
      }

      return true
    } catch (error) {
      console.error('Error deleting session:', error)
      return false
    }
  }

  getAllSessions(): SessionData[] {
    return Array.from(this.sessions.values()).map(session => session.data)
  }

  getActiveSessions(): SessionData[] {
    return this.getAllSessions().filter(session => session.status === 'active')
  }

  async saveSession(sessionId: string, sessionData: SessionData): Promise<void> {
    try {
      const sessionFile = path.join(this.sessionsDir, `${sessionId}.json`)
      const dataToSave = {
        ...sessionData,
        lastActive: sessionData.lastActive.toISOString(),
        createdAt: sessionData.createdAt.toISOString()
      }
      
      fs.writeFileSync(sessionFile, JSON.stringify(dataToSave, null, 2))
    } catch (error) {
      console.error('Error saving session:', error)
      throw error
    }
  }

  async backupSession(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId)
    
    if (!session) {
      throw new Error('Session not found')
    }

    try {
      const backupDir = path.join(this.sessionsDir, 'backups')
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupFile = path.join(backupDir, `${sessionId}_${timestamp}.json`)
      
      const backupData = {
        sessionData: session.data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
      
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))
      
      return backupFile
    } catch (error) {
      console.error('Error backing up session:', error)
      throw error
    }
  }

  async restoreSession(backupFile: string): Promise<string> {
    try {
      const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'))
      
      if (!backupData.sessionData || !backupData.sessionData.id) {
        throw new Error('Invalid backup file')
      }

      const sessionId = backupData.sessionData.id
      
      // Create new session from backup
      await this.createSession(sessionId, backupData.sessionData.config)
      
      return sessionId
    } catch (error) {
      console.error('Error restoring session:', error)
      throw error
    }
  }

  async cleanupOldSessions(): Promise<void> {
    try {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.data.lastActive < thirtyDaysAgo && session.data.status === 'inactive') {
          console.log(`Cleaning up old session: ${sessionId}`)
          await this.deleteSession(sessionId)
        }
      }

      // Clean up old backup files
      const backupDir = path.join(this.sessionsDir, 'backups')
      if (fs.existsSync(backupDir)) {
        const backupFiles = fs.readdirSync(backupDir)
        
        for (const backupFile of backupFiles) {
          const filePath = path.join(backupDir, backupFile)
          const stats = fs.statSync(filePath)
          
          if (stats.mtime < thirtyDaysAgo) {
            fs.unlinkSync(filePath)
            console.log(`Deleted old backup: ${backupFile}`)
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old sessions:', error)
    }
  }

  getSessionStats(): {
    total: number
    active: number
    inactive: number
    error: number
    oldestSession: Date | null
    newestSession: Date | null
  } {
    const sessions = this.getAllSessions()
    
    if (sessions.length === 0) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        error: 0,
        oldestSession: null,
        newestSession: null
      }
    }

    const active = sessions.filter(s => s.status === 'active').length
    const inactive = sessions.filter(s => s.status === 'inactive').length
    const error = sessions.filter(s => s.status === 'error').length
    
    const sortedByDate = sessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    
    return {
      total: sessions.length,
      active,
      inactive,
      error,
      oldestSession: sortedByDate[0]?.createdAt || null,
      newestSession: sortedByDate[sortedByDate.length - 1]?.createdAt || null
    }
  }

  // Get latest cached QR code for session
  getLatestQRCode(sessionId: string): string | null {
    const cached = this.qrCache.get(sessionId)
    if (cached && (Date.now() - cached.timestamp.getTime()) < 60000) { // Cache for 1 minute
      return cached.qr
    }
    return null
  }

  // Cache QR code for session
  cacheQRCode(sessionId: string, qr: string): void {
    this.qrCache.set(sessionId, { qr, timestamp: new Date() })
  }

  // Clear QR cache for session
  clearQRCache(sessionId: string): void {
    this.qrCache.delete(sessionId)
  }

  // Force QR generation for session
  async forceQRGeneration(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    
    if (!session) {
      return false
    }

    try {
      if (session.bot) {
        await session.bot.forceQRGeneration()
      } else {
        // Initialize bot first
        const bot = new WhatsAppBot(session.data.config)
        bot.setSessionManager(this)
        await bot.preInitialize()
        await bot.forceQRGeneration()
        
        session.bot = bot
        session.data.status = 'active'
        session.data.lastActive = new Date()
        await this.saveSession(sessionId, session.data)
      }
      
      return true
    } catch (error) {
      console.error('Error forcing QR generation:', error)
      return false
    }
  }

  // Health check for all sessions
  async healthCheck(): Promise<{ sessionId: string; healthy: boolean; error?: string }[]> {
    const results: { sessionId: string; healthy: boolean; error?: string }[] = []

    for (const [sessionId, session] of this.sessions.entries()) {
      try {
        if (session.bot && session.data.status === 'active') {
          const isConnected = session.bot.isConnectedToWhatsApp()
          
          if (!isConnected) {
            results.push({
              sessionId,
              healthy: false,
              error: 'Bot not connected to WhatsApp'
            })
          } else {
            results.push({ sessionId, healthy: true })
          }
        } else {
          results.push({
            sessionId,
            healthy: false,
            error: session.data.status === 'error' ? 'Session in error state' : 'Session not active'
          })
        }
      } catch (error) {
        results.push({
          sessionId,
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  // Start periodic cleanup and health checks
  startPeriodicMaintenance() {
    // Run cleanup every 24 hours
    setInterval(() => {
      this.cleanupOldSessions()
    }, 24 * 60 * 60 * 1000)

    // Run health check every hour
    setInterval(async () => {
      const healthResults = await this.healthCheck()
      
      // Log unhealthy sessions
      healthResults.forEach(result => {
        if (!result.healthy) {
          console.warn(`Session ${result.sessionId} is unhealthy: ${result.error}`)
        }
      })
    }, 60 * 60 * 1000)
  }
}

export default SessionManager
export type { SessionData }