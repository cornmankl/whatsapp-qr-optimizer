import { default as makeWASocket, DisconnectReason, useMultiFileAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { z } from 'zod'
import { db } from '@/lib/db'
import P from 'pino'
import fs from 'fs'
import path from 'path'
import { writeFile } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { broadcastWhatsAppQR, broadcastWhatsAppConnectionUpdate } from '@/lib/socket'

// Disable React hooks linting for this file since it's not a React component
/* eslint-disable react-hooks/rules-of-hooks */

// Command schemas
const CommandSchema = z.object({
  type: z.enum(['task', 'note', 'project', 'search', 'list', 'help', 'ai', 'remind', 'status']),
  action: z.enum(['create', 'update', 'delete', 'list', 'search', 'complete', 'start', 'stop']).optional(),
  data: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional()
})

type Command = z.infer<typeof CommandSchema>

interface WhatsAppMessage {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message: {
    conversation?: string
    extendedTextMessage?: {
      text?: string
    }
  }
  pushName: string
}

interface WhatsAppBotConfig {
  sessionId: string
  autoReply: boolean
  aiEnabled: boolean
  authorizedNumbers: string[]
}

class WhatsAppBot {
  private sock: any
  private config: WhatsAppBotConfig
  private isConnected = false
  private messageHandlers: Map<string, (msg: WhatsAppMessage, command: Command) => Promise<string>> = new Map()
  private sessionManager: any // Reference to session manager for QR caching
  private isInitialized = false
  private initializationPromise: Promise<void> | null = null

  constructor(config: WhatsAppBotConfig) {
    this.config = config
    this.setupMessageHandlers()
  }

  // Set session manager reference for QR caching
  setSessionManager(manager: any) {
    this.sessionManager = manager
  }

  // Pre-emptive initialization for faster QR generation
  async preInitialize(): Promise<void> {
    if (this.isInitialized || this.initializationPromise) {
      return this.initializationPromise || Promise.resolve()
    }

    this.initializationPromise = this.doInitialize()
    return this.initializationPromise
  }

  private async doInitialize(): Promise<void> {
    try {
      console.log(`Pre-initializing WhatsApp bot for session: ${this.config.sessionId}`)
      
      // Pre-fetch version to avoid delay during socket creation
      const { version } = await fetchLatestBaileysVersion()
      
      // Pre-create auth state
      const sessionPath = path.join(process.cwd(), 'whatsapp-sessions', this.config.sessionId)
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
      
      // Create socket immediately but don't connect yet
      this.sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' })),
        },
        browser: ['Second Brain Bot', 'Chrome', '120.0.0.0'],
        // Aggressive timeouts for fast QR
        connectTimeoutMs: 10000, // Reduced to 10 seconds
        qrTimeout: 8000, // Reduced to 8 seconds
        defaultQueryTimeoutMs: 10000,
        keepAliveIntervalMs: 20000,
        // Additional optimizations
        retryRequestDelayMs: 1000,
        maxRetries: 3,
      })

      // Set up event listeners
      this.sock.ev.on('creds.update', saveCreds)
      this.sock.ev.on('connection.update', this.handleConnectionUpdate.bind(this))
      this.sock.ev.on('messages.upsert', this.handleMessageUpsert.bind(this))

      this.isInitialized = true
      console.log(`WhatsApp bot pre-initialized for session: ${this.config.sessionId}`)
    } catch (error) {
      console.error('Failed to pre-initialize WhatsApp bot:', error)
      this.initializationPromise = null
      throw error
    }
  }

  private setupMessageHandlers() {
    // Task handlers
    this.messageHandlers.set('task_create', this.handleTaskCreate.bind(this))
    this.messageHandlers.set('task_list', this.handleTaskList.bind(this))
    this.messageHandlers.set('task_complete', this.handleTaskComplete.bind(this))
    
    // Note handlers
    this.messageHandlers.set('note_create', this.handleNoteCreate.bind(this))
    this.messageHandlers.set('note_list', this.handleNoteList.bind(this))
    
    // Project handlers
    this.messageHandlers.set('project_create', this.handleProjectCreate.bind(this))
    this.messageHandlers.set('project_list', this.handleProjectList.bind(this))
    
    // Search handler
    this.messageHandlers.set('search', this.handleSearch.bind(this))
    
    // AI Assistant handler
    this.messageHandlers.set('ai', this.handleAIQuery.bind(this))
    
    // Help handler
    this.messageHandlers.set('help', this.handleHelp.bind(this))
    
    // Status handler
    this.messageHandlers.set('status', this.handleStatus.bind(this))
  }

  async initialize() {
    try {
      // Use pre-initialization if available
      if (this.isInitialized) {
        console.log(`WhatsApp bot already initialized for session: ${this.config.sessionId}`)
        return
      }

      // Start pre-initialization
      await this.preInitialize()
      console.log('WhatsApp Bot initialized successfully')
    } catch (error) {
      console.error('Failed to initialize WhatsApp Bot:', error)
      throw error
    }
  }

  private handleConnectionUpdate(update: any) {
    const { connection, lastDisconnect, qr } = update

    // Handle QR code generation - immediate response
    if (qr) {
      console.log(`QR code generated for session: ${this.config.sessionId}`)
      this.broadcastQRUpdate(qr)
      return // Prioritize QR handling
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('Connection closed. Reconnecting:', shouldReconnect)
      this.broadcastConnectionUpdate('close')
      
      if (shouldReconnect) {
        setTimeout(() => this.initialize(), 5000)
      }
    } else if (connection === 'open') {
      this.isConnected = true
      console.log('WhatsApp Bot connected successfully')
      this.broadcastConnectionUpdate('open')
      // Clear QR cache when connected
      if (this.sessionManager) {
        this.sessionManager.clearQRCache(this.config.sessionId)
      }
    } else if (connection === 'connecting') {
      console.log('WhatsApp Bot connecting...')
      this.broadcastConnectionUpdate('connecting')
    }
  }

  private async handleMessageUpsert(m: any) {
    const { messages } = m
    const msg = messages[0]

    if (!msg.message || msg.key.fromMe) return

    const phoneNumber = msg.key.remoteJid.split('@')[0]
    
    // Check if number is authorized
    if (!this.config.authorizedNumbers.includes(phoneNumber)) {
      await this.sendMessage(msg.key.remoteJid, 'Maaf, anda tidak diizinkan menggunakan bot ini.')
      return
    }

    // Handle media messages
    if (msg.message.imageMessage || msg.message.documentMessage || msg.message.audioMessage || msg.message.videoMessage) {
      await this.handleMediaMessage(msg)
      return
    }

    const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text
    if (!messageText) return

    try {
      const command = this.parseCommand(messageText)
      const response = await this.processCommand(msg, command)
      
      if (response) {
        await this.sendMessage(msg.key.remoteJid, response)
      }
    } catch (error) {
      console.error('Error processing message:', error)
      await this.sendMessage(msg.key.remoteJid, 'Maaf, terjadi kesalahan. Sila cuba lagi.')
    }
  }

  private async handleMediaMessage(msg: any) {
    try {
      const mediaType = msg.message.imageMessage ? 'image' :
                       msg.message.documentMessage ? 'document' :
                       msg.message.audioMessage ? 'audio' :
                       msg.message.videoMessage ? 'video' : 'unknown'

      // Download media
      const buffer = await this.downloadMediaMessage(msg)
      
      if (!buffer) {
        await this.sendMessage(msg.key.remoteJid, 'Maaf, tidak dapat memuat turun media.')
        return
      }

      // Save media file
      const fileName = `${uuidv4()}.${this.getFileExtension(mediaType, msg)}`
      const filePath = path.join(process.cwd(), 'uploads', 'whatsapp', fileName)
      
      // Create directory if it doesn't exist
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
      await writeFile(filePath, buffer)

      // Create note with media attachment
      const userId = await this.ensureDefaultUser()
      
      const note = await db.note.create({
        data: {
          title: `Media dari ${msg.pushName}`,
          content: `Media ${mediaType} diterima melalui WhatsApp`,
          mediaUrl: `/uploads/whatsapp/${fileName}`,
          mediaType,
          userId
        }
      })

      const response = `📎 *Media Diterima*\n\n` +
                      `📝 *Note ID:* ${note.id}\n` +
                      `📋 *Type:* ${mediaType}\n` +
                      `📁 *File:* ${fileName}\n\n` +
                      `Media telah disimpan sebagai note dalam Second Brain anda.`

      await this.sendMessage(msg.key.remoteJid, response)
    } catch (error) {
      console.error('Error handling media message:', error)
      await this.sendMessage(msg.key.remoteJid, 'Maaf, terjadi kesalahan semasa memproses media.')
    }
  }

  private async downloadMediaMessage(msg: any): Promise<Buffer | null> {
    try {
      const mediaMessage = msg.message.imageMessage || 
                          msg.message.documentMessage || 
                          msg.message.audioMessage || 
                          msg.message.videoMessage

      if (!mediaMessage) return null

      const stream = await this.sock.downloadMediaMessage(msg)
      const chunks: Buffer[] = []
      
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
      })
    } catch (error) {
      console.error('Error downloading media:', error)
      return null
    }
  }

  private getFileExtension(mediaType: string, msg: any): string {
    switch (mediaType) {
      case 'image':
        return msg.message.imageMessage?.mimetype.split('/')[1] || 'jpg'
      case 'document':
        return msg.message.documentMessage?.mimetype.split('/')[1] || 'pdf'
      case 'audio':
        return msg.message.audioMessage?.mimetype.split('/')[1] || 'mp3'
      case 'video':
        return msg.message.videoMessage?.mimetype.split('/')[1] || 'mp4'
      default:
        return 'bin'
    }
  }

  private async ensureDefaultUser(): Promise<string> {
    try {
      let user = await db.user.findUnique({
        where: { email: 'default@example.com' }
      })

      if (!user) {
        user = await db.user.create({
          data: {
            email: 'default@example.com',
            name: 'Default User'
          }
        })
      }

      return user.id
    } catch (error) {
      console.error('Error ensuring default user:', error)
      throw error
    }
  }

  private parseCommand(text: string): Command {
    const lowerText = text.toLowerCase().trim()
    
    // Task commands
    if (lowerText.startsWith('task') || lowerText.startsWith('tugas')) {
      const parts = lowerText.split(' ')
      const action = parts[1] as Command['action']
      
      return {
        type: 'task',
        action,
        data: text.substring(text.indexOf(' ') + 1).replace(/^(task|tugas)\s+\w+\s*/, '')
      }
    }
    
    // Note commands
    if (lowerText.startsWith('note') || lowerText.startsWith('catatan')) {
      const parts = lowerText.split(' ')
      const action = parts[1] as Command['action']
      
      return {
        type: 'note',
        action,
        data: text.substring(text.indexOf(' ') + 1).replace(/^(note|catatan)\s+\w+\s*/, '')
      }
    }
    
    // Project commands
    if (lowerText.startsWith('project') || lowerText.startsWith('projek')) {
      const parts = lowerText.split(' ')
      const action = parts[1] as Command['action']
      
      return {
        type: 'project',
        action,
        data: text.substring(text.indexOf(' ') + 1).replace(/^(project|projek)\s+\w+\s*/, '')
      }
    }
    
    // Search command
    if (lowerText.startsWith('search') || lowerText.startsWith('cari')) {
      return {
        type: 'search',
        data: text.substring(text.indexOf(' ') + 1).replace(/^(search|cari)\s*/, '')
      }
    }
    
    // AI command
    if (lowerText.startsWith('ai') || lowerText.startsWith('assistant')) {
      return {
        type: 'ai',
        data: text.substring(text.indexOf(' ') + 1).replace(/^(ai|assistant)\s*/, '')
      }
    }
    
    // Status command
    if (lowerText.startsWith('status')) {
      return {
        type: 'status'
      }
    }
    
    // Help command
    if (lowerText.startsWith('help') || lowerText.startsWith('bantuan')) {
      return {
        type: 'help'
      }
    }
    
    // Default to AI query if no command found
    return {
      type: 'ai',
      data: text
    }
  }

  private async processCommand(msg: WhatsAppMessage, command: Command): Promise<string> {
    const handlerKey = `${command.type}_${command.action || 'default'}`
    const handler = this.messageHandlers.get(handlerKey)
    
    if (handler) {
      return await handler(msg, command)
    }
    
    // Fallback to AI if no specific handler found
    if (command.type === 'ai') {
      return await this.handleAIQuery(msg, command)
    }
    
    return 'Command tidak dikenali. Ketik "help" untuk bantuan.'
  }

  private async handleTaskCreate(msg: WhatsAppMessage, command: Command): Promise<string> {
    if (!command.data) return 'Sila berikan keterangan untuk task baru.'
    
    try {
      const userId = await this.ensureDefaultUser()
      
      const task = await db.task.create({
        data: {
          title: command.data,
          description: `Created via WhatsApp by ${msg.pushName}`,
          priority: (command.priority || 'medium').toUpperCase() as any,
          status: 'TODO',
          dueDate: command.dueDate ? new Date(command.dueDate) : null,
          userId
        }
      })
      
      return `✅ Task berjaya dicipta:\n📝 ${task.title}\n🆔 ID: ${task.id}\n⭐ Priority: ${task.priority}\n📅 Due: ${task.dueDate ? task.dueDate.toLocaleDateString() : 'Not set'}`
    } catch (error) {
      console.error('Error creating task:', error)
      return '❌ Gagal mencipta task. Sila cuba lagi.'
    }
  }

  private async handleTaskList(msg: WhatsAppMessage, command: Command): Promise<string> {
    try {
      const tasks = await db.task.findMany({
        where: { status: 'TODO' },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      
      if (tasks.length === 0) {
        return '📋 Tiada task aktif.'
      }
      
      let response = '📋 *Senarai Task Aktif:*\n\n'
      tasks.forEach((task, index) => {
        response += `${index + 1}. ${task.title}\n   🆔 ${task.id}\n   ⭐ ${task.priority}\n   📅 ${task.dueDate ? task.dueDate.toLocaleDateString() : 'No due date'}\n\n`
      })
      
      return response
    } catch (error) {
      console.error('Error listing tasks:', error)
      return '❌ Gagal mengambil senarai task.'
    }
  }

  private async handleTaskComplete(msg: WhatsAppMessage, command: Command): Promise<string> {
    if (!command.data) return 'Sila berikan ID task yang ingin dilengkapkan.'
    
    try {
      const taskId = command.data.trim()
      const task = await db.task.update({
        where: { id: taskId },
        data: { status: 'DONE' }
      })
      
      return `✅ Task "${task.title}" telah dilengkapkan!`
    } catch (error) {
      console.error('Error completing task:', error)
      return '❌ Gagal melengkapkan task. Sila pastikan ID adalah betul.'
    }
  }

  private async handleNoteCreate(msg: WhatsAppMessage, command: Command): Promise<string> {
    if (!command.data) return 'Sila berikan kandungan untuk note baru.'
    
    try {
      const userId = await this.ensureDefaultUser()
      
      const note = await db.note.create({
        data: {
          title: command.data.substring(0, 50) + (command.data.length > 50 ? '...' : ''),
          content: command.data,
          userId
        }
      })
      
      return `📝 Note berjaya dicipta:\n📋 ${note.title}\n🆔 ID: ${note.id}`
    } catch (error) {
      console.error('Error creating note:', error)
      return '❌ Gagal mencipta note. Sila cuba lagi.'
    }
  }

  private async handleNoteList(msg: WhatsAppMessage, command: Command): Promise<string> {
    try {
      const notes = await db.note.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      
      if (notes.length === 0) {
        return '📝 Tiada note.'
      }
      
      let response = '📝 *Senarai Note:*\n\n'
      notes.forEach((note, index) => {
        response += `${index + 1}. ${note.title}\n   🆔 ${note.id}\n   📅 ${note.createdAt.toLocaleDateString()}\n\n`
      })
      
      return response
    } catch (error) {
      console.error('Error listing notes:', error)
      return '❌ Gagal mengambil senarai note.'
    }
  }

  private async handleProjectCreate(msg: WhatsAppMessage, command: Command): Promise<string> {
    if (!command.data) return 'Sila berikan nama untuk project baru.'
    
    try {
      const userId = await this.ensureDefaultUser()
      
      const project = await db.project.create({
        data: {
          name: command.data,
          description: `Created via WhatsApp by ${msg.pushName}`,
          status: 'PLANNING',
          userId
        }
      })
      
      return `🚀 Project berjaya dicipta:\n📋 ${project.name}\n🆔 ID: ${project.id}`
    } catch (error) {
      console.error('Error creating project:', error)
      return '❌ Gagal mencipta project. Sila cuba lagi.'
    }
  }

  private async handleProjectList(msg: WhatsAppMessage, command: Command): Promise<string> {
    try {
      const projects = await db.project.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }
      })
      
      if (projects.length === 0) {
        return '🚀 Tiada project aktif.'
      }
      
      let response = '🚀 *Senarai Project Aktif:*\n\n'
      projects.forEach((project, index) => {
        response += `${index + 1}. ${project.name}\n   🆔 ${project.id}\n   📅 ${project.createdAt.toLocaleDateString()}\n\n`
      })
      
      return response
    } catch (error) {
      console.error('Error listing projects:', error)
      return '❌ Gagal mengambil senarai project.'
    }
  }

  private async handleSearch(msg: WhatsAppMessage, command: Command): Promise<string> {
    if (!command.data) return 'Sila berikan kata kunci untuk pencarian.'
    
    try {
      const searchTerm = command.data.toLowerCase()
      
      // Search in tasks
      const tasks = await db.task.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } }
          ]
        },
        take: 5
      })
      
      // Search in notes
      const notes = await db.note.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm } },
            { content: { contains: searchTerm } }
          ]
        },
        take: 5
      })
      
      // Search in projects
      const projects = await db.project.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { description: { contains: searchTerm } }
          ]
        },
        take: 5
      })
      
      let response = `🔍 *Hasil Pencarian untuk "${command.data}":*\n\n`
      
      if (tasks.length > 0) {
        response += '📋 *Tasks:*\n'
        tasks.forEach(task => {
          response += `• ${task.title} (ID: ${task.id})\n`
        })
        response += '\n'
      }
      
      if (notes.length > 0) {
        response += '📝 *Notes:*\n'
        notes.forEach(note => {
          response += `• ${note.title} (ID: ${note.id})\n`
        })
        response += '\n'
      }
      
      if (projects.length > 0) {
        response += '🚀 *Projects:*\n'
        projects.forEach(project => {
          response += `• ${project.name} (ID: ${project.id})\n`
        })
        response += '\n'
      }
      
      if (tasks.length === 0 && notes.length === 0 && projects.length === 0) {
        response += 'Tiada hasil dijumpai.'
      }
      
      return response
    } catch (error) {
      console.error('Error searching:', error)
      return '❌ Gagal melakukan pencarian.'
    }
  }

  private async handleAIQuery(msg: WhatsAppMessage, command: Command): Promise<string> {
    if (!this.config.aiEnabled) return 'AI Assistant tidak diaktifkan.'
    if (!command.data) return 'Sila berikan soalan untuk AI Assistant.'
    
    try {
      const ZAI = await import('z-ai-web-dev-sdk')
      const zaiModule = await ZAI.default.create()
      
      const completion = await zaiModule.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Anda adalah AI Assistant untuk Second Brain. Bantu pengguna dengan soalan mereka dan berikan jawapan yang berguna dan ringkas.'
          },
          {
            role: 'user',
            content: command.data
          }
        ]
      })
      
      const response = completion.choices[0]?.message?.content || 'Maaf, saya tidak dapat menjawab soalan anda sekarang.'
      return `🤖 *AI Assistant:*\n\n${response}`
    } catch (error) {
      console.error('Error with AI query:', error)
      return '❌ Gagal menghubungi AI Assistant. Sila cuba lagi.'
    }
  }

  private async handleStatus(msg: WhatsAppMessage, command: Command): Promise<string> {
    try {
      const [taskCount, noteCount, projectCount] = await Promise.all([
        db.task.count({ where: { status: 'TODO' } }),
        db.note.count(),
        db.project.count({ where: { status: 'ACTIVE' } })
      ])
      
      return `📊 *Status Second Brain:*\n\n` +
             `📋 Task Aktif: ${taskCount}\n` +
             `📝 Total Notes: ${noteCount}\n` +
             `🚀 Active Projects: ${projectCount}\n\n` +
             `🤖 AI Assistant: ${this.config.aiEnabled ? 'Aktif' : 'Tidak Aktif'}\n` +
             `📱 WhatsApp Bot: ${this.isConnected ? 'Online' : 'Offline'}`
    } catch (error) {
      console.error('Error getting status:', error)
      return '❌ Gagal mendapatkan status.'
    }
  }

  private async handleHelp(msg: WhatsAppMessage, command: Command): Promise<string> {
    return `🤖 *Second Brain WhatsApp Bot - Bantuan*\n\n` +
           `📋 *Task Commands:*\n` +
           `• task create [keterangan] - Cipta task baru\n` +
           `• tugas create [keterangan] - Cipta task baru\n` +
           `• task list - Senarai task aktif\n` +
           `• tugas list - Senarai task aktif\n` +
           `• task complete [id] - Lengkapkan task\n` +
           `• tugas complete [id] - Lengkapkan task\n\n` +
           `📝 *Note Commands:*\n` +
           `• note create [kandungan] - Cipta note baru\n` +
           `• catatan create [kandungan] - Cipta note baru\n` +
           `• note list - Senarai semua note\n` +
           `• catatan list - Senarai semua note\n\n` +
           `🚀 *Project Commands:*\n` +
           `• project create [nama] - Cipta project baru\n` +
           `• projek create [nama] - Cipta project baru\n` +
           `• project list - Senarai project aktif\n` +
           `• projek list - Senarai project aktif\n\n` +
           `🔍 *Search Commands:*\n` +
           `• search [kata kunci] - Cari dalam semua kandungan\n` +
           `• cari [kata kunci] - Cari dalam semua kandungan\n\n` +
           `🤖 *AI Commands:*\n` +
           `• ai [soalan] - Tanya AI Assistant\n` +
           `• assistant [soalan] - Tanya AI Assistant\n\n` +
           `📊 *Other Commands:*\n` +
           `• status - Dapatkan status sistem\n` +
           `• help - Papar bantuan ini\n\n` +
           `💡 *Tips:* Anda juga boleh hantar mesej terus untuk AI Assistant!`
  }

  private async sendMessage(jid: string, message: string) {
    if (!this.isConnected || !this.sock) return
    
    try {
      await this.sock.sendMessage(jid, { text: message })
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  async sendNotification(jid: string, title: string, message: string) {
    if (!this.isConnected || !this.sock) return
    
    const notification = `🔔 *${title}*\n\n${message}`
    await this.sendMessage(jid, notification)
  }

  isConnectedToWhatsApp(): boolean {
    return this.isConnected
  }

  getConnectionStatus(): string {
    return this.isConnected ? 'Connected' : 'Disconnected'
  }

  // Public method to send messages
  async sendPublicMessage(jid: string, message: string) {
    return this.sendMessage(jid, message)
  }

  // Force QR generation - aggressive approach
  async forceQRGeneration(): Promise<void> {
    try {
      console.log(`Force generating QR for session: ${this.config.sessionId}`)
      
      // Ensure we're initialized
      if (!this.isInitialized) {
        await this.preInitialize()
      }
      
      // Force reconnection if needed
      if (this.sock) {
        try {
          await this.sock.ws?.close()
        } catch (error) {
          console.log('Error closing existing connection:', error)
        }
      }
      
      // Re-initialize with aggressive settings
      await this.reinitializeWithAggressiveSettings()
      
    } catch (error) {
      console.error('Error in force QR generation:', error)
      throw error
    }
  }

  private async reinitializeWithAggressiveSettings(): Promise<void> {
    const { version } = await fetchLatestBaileysVersion()
    const sessionPath = path.join(process.cwd(), 'whatsapp-sessions', this.config.sessionId)
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
    
    // Create new socket with very aggressive settings
    this.sock = makeWASocket({
      version,
      logger: P({ level: 'silent' }),
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' })),
      },
      browser: ['Second Brain Bot', 'Chrome', '120.0.0.0'],
      // Very aggressive timeouts
      connectTimeoutMs: 5000, // 5 seconds
      qrTimeout: 3000, // 3 seconds
      defaultQueryTimeoutMs: 5000,
      keepAliveIntervalMs: 15000,
      retryRequestDelayMs: 500,
      maxRetries: 2,
    })

    // Set up event listeners
    this.sock.ev.on('creds.update', saveCreds)
    this.sock.ev.on('connection.update', this.handleConnectionUpdate.bind(this))
    this.sock.ev.on('messages.upsert', this.handleMessageUpsert.bind(this))
  }
  // Broadcast QR code update to connected clients
  private broadcastQRUpdate(qr: string) {
    try {
      // Cache QR code in session manager
      if (this.sessionManager) {
        this.sessionManager.cacheQRCode(this.config.sessionId, qr)
      }
      
      // Direct import for faster response
      broadcastWhatsAppQR(this.config.sessionId, qr)
    } catch (error) {
      console.error('Error broadcasting QR update:', error)
    }
  }

  // Broadcast connection status update to connected clients
  private broadcastConnectionUpdate(connection: string) {
    try {
      // Direct import for faster response
      broadcastWhatsAppConnectionUpdate(this.config.sessionId, connection)
    } catch (error) {
      console.error('Error broadcasting connection update:', error)
    }
  }

  async disconnect() {
    if (this.sock && this.isConnected) {
      await this.sock.logout()
      this.isConnected = false
    }
  }

  // Get bot configuration
  getConfig(): WhatsAppBotConfig {
    return { ...this.config }
  }

  // Update bot configuration
  updateConfig(newConfig: Partial<WhatsAppBotConfig>) {
    this.config = { ...this.config, ...newConfig }
  }
}

export default WhatsAppBot
export type { Command, WhatsAppBotConfig }