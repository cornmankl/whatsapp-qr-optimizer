import { NextRequest, NextResponse } from 'next/server'
import SessionManager from '@/lib/session-manager'

// Global session manager instance
let sessionManager: SessionManager | null = null

function getSessionManager(): SessionManager {
  if (!sessionManager) {
    sessionManager = new SessionManager()
    sessionManager.startPeriodicMaintenance()
  }
  return sessionManager
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const manager = getSessionManager()
    
    switch (action) {
      case 'status':
        const sessionId = searchParams.get('sessionId') || 'default'
        const bot = await manager.getSession(sessionId)
        return NextResponse.json({
          success: true,
          connected: bot?.isConnectedToWhatsApp() || false,
          status: bot?.getConnectionStatus() || 'Not initialized',
          sessionId
        })
        
      case 'sessions':
        const sessions = manager.getAllSessions()
        const stats = manager.getSessionStats()
        return NextResponse.json({
          success: true,
          sessions,
          stats
        })
        
      case 'health':
        const healthResults = await manager.healthCheck()
        return NextResponse.json({
          success: true,
          health: healthResults
        })
        
      case 'qr':
        const qrSessionId = searchParams.get('sessionId') || 'default'
        const qrBot = await manager.getSession(qrSessionId)
        if (!qrBot) {
          return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
        }
        
        // Check if we have a cached QR code
        const cachedQR = await manager.getLatestQRCode(qrSessionId)
        if (cachedQR) {
          return NextResponse.json({ 
            success: true, 
            qr: cachedQR,
            timestamp: new Date().toISOString()
          })
        }
        
        // Force QR generation
        const forceQrResult = await manager.forceQRGeneration(qrSessionId)
        if (forceQrResult) {
          return NextResponse.json({ 
            success: true, 
            message: 'QR code generation forced, waiting for QR code...'
          })
        }
        
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to force QR generation' 
        }, { status: 500 })
        
      case 'force-qr':
        const forceSessionId = searchParams.get('sessionId') || 'default'
        const forceResult = await manager.forceQRGeneration(forceSessionId)
        
        if (forceResult) {
          return NextResponse.json({ 
            success: true, 
            message: 'QR code generation forced successfully'
          })
        }
        
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to force QR generation' 
        }, { status: 500 })
        
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('WhatsApp API GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const body = await request.json()
    const manager = getSessionManager()
    
    switch (action) {
      case 'initialize':
        const sessionId = body.sessionId || 'default'
        const existingSession = await manager.getSession(sessionId)
        
        if (existingSession && existingSession.isConnectedToWhatsApp()) {
          return NextResponse.json({ 
            success: false, 
            error: 'Session already exists and is connected. Please disconnect first or use a different session ID.' 
          }, { status: 400 })
        }
        
        // If session exists but is not connected, delete it and create a new one
        if (existingSession) {
          await manager.deleteSession(sessionId)
          console.log(`Deleted existing disconnected session: ${sessionId}`)
        }
        
        const config = {
          sessionId,
          autoReply: body.autoReply ?? true,
          aiEnabled: body.aiEnabled ?? true,
          authorizedNumbers: body.authorizedNumbers || []
        }
        
        const bot = await manager.createSession(sessionId, config)
        
        return NextResponse.json({ 
          success: true, 
          message: 'Bot initialized successfully',
          sessionId 
        })
        
      case 'reinitialize':
        const reinitSessionId = body.sessionId || 'default'
        const reinitExistingSession = await manager.getSession(reinitSessionId)
        
        // Always delete existing session and create a new one
        if (reinitExistingSession) {
          await manager.deleteSession(reinitSessionId)
          console.log(`Force deleted existing session: ${reinitSessionId}`)
        }
        
        const reinitConfig = {
          sessionId: reinitSessionId,
          autoReply: body.autoReply ?? true,
          aiEnabled: body.aiEnabled ?? true,
          authorizedNumbers: body.authorizedNumbers || []
        }
        
        const reinitBot = await manager.createSession(reinitSessionId, reinitConfig)
        
        return NextResponse.json({ 
          success: true, 
          message: 'Bot reinitialized successfully',
          sessionId: reinitSessionId 
        })
        
      case 'send':
        const sendSessionId = body.sessionId || 'default'
        const sendBot = await manager.getSession(sendSessionId)
        
        if (!sendBot || !sendBot.isConnectedToWhatsApp()) {
          return NextResponse.json({ success: false, error: 'Bot not connected' }, { status: 400 })
        }
        
        const { jid, message } = body
        if (!jid || !message) {
          return NextResponse.json({ success: false, error: 'JID and message are required' }, { status: 400 })
        }
        
        await sendBot.sendPublicMessage(jid, message)
        return NextResponse.json({ success: true, message: 'Message sent' })
        
      case 'notification':
        const notifySessionId = body.sessionId || 'default'
        const notifyBot = await manager.getSession(notifySessionId)
        
        if (!notifyBot || !notifyBot.isConnectedToWhatsApp()) {
          return NextResponse.json({ success: false, error: 'Bot not connected' }, { status: 400 })
        }
        
        const { jid: notifyJid, title, content } = body
        if (!notifyJid || !title || !content) {
          return NextResponse.json({ success: false, error: 'JID, title, and content are required' }, { status: 400 })
        }
        
        await notifyBot.sendNotification(notifyJid, title, content)
        return NextResponse.json({ success: true, message: 'Notification sent' })
        
      case 'disconnect':
        const disconnectSessionId = body.sessionId || 'default'
        const disconnected = await manager.deleteSession(disconnectSessionId)
        
        if (disconnected) {
          return NextResponse.json({ success: true, message: 'Session disconnected' })
        }
        return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
        
      case 'backup':
        const backupSessionId = body.sessionId || 'default'
        try {
          const backupFile = await manager.backupSession(backupSessionId)
          return NextResponse.json({ 
            success: true, 
            message: 'Session backed up successfully',
            backupFile 
          })
        } catch (error) {
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to backup session' 
          }, { status: 500 })
        }
        
      case 'restore':
        if (!body.backupFile) {
          return NextResponse.json({ 
            success: false, 
            error: 'Backup file is required' 
          }, { status: 400 })
        }
        
        try {
          const restoredSessionId = await manager.restoreSession(body.backupFile)
          return NextResponse.json({ 
            success: true, 
            message: 'Session restored successfully',
            sessionId: restoredSessionId 
          })
        } catch (error) {
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to restore session' 
          }, { status: 500 })
        }
        
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('WhatsApp API POST error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}