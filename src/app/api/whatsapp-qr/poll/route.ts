import { NextRequest, NextResponse } from 'next/server'
import SessionManager from '@/lib/session-manager'

// Global session manager instance for polling
let sessionManager: SessionManager | null = null

function getSessionManager(): SessionManager {
  if (!sessionManager) {
    sessionManager = new SessionManager()
  }
  return sessionManager
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId') || 'default'
    
    const manager = getSessionManager()
    const bot = await manager.getSession(sessionId)
    
    if (!bot) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session not found',
        sessionId 
      }, { status: 404 })
    }

    // Get current status and QR code if available
    const isConnected = bot.isConnectedToWhatsApp()
    const connectionStatus = bot.getConnectionStatus()
    const cachedQR = await manager.getLatestQRCode(sessionId)
    
    return NextResponse.json({
      success: true,
      sessionId,
      connected: isConnected,
      status: connectionStatus,
      qr: cachedQR || null,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('WhatsApp QR polling error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}