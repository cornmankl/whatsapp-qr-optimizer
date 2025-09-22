import { NextRequest } from 'next/server'

// Store active WebSocket connections for QR updates
const qrConnections = new Map<string, WebSocket[]>()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return new Response('Session ID is required', { status: 400 })
    }

    // For HTTP requests, return QR code if available
    return new Response(JSON.stringify({
      success: true,
      message: 'QR code endpoint available',
      sessionId,
      websocketUrl: `ws://localhost:3000/api/whatsapp-qr?sessionId=${sessionId}`
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('WhatsApp QR API error:', error)
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Function to broadcast QR code updates to connected clients
export function broadcastQRUpdate(sessionId: string, qrCode: string) {
  const connections = qrConnections.get(sessionId) || []
  const message = JSON.stringify({
    type: 'qr',
    qr: qrCode,
    sessionId,
    timestamp: new Date().toISOString()
  })
  
  connections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message)
    }
  })
}

// Function to broadcast connection status updates
export function broadcastConnectionUpdate(sessionId: string, connection: string) {
  const connections = qrConnections.get(sessionId) || []
  const message = JSON.stringify({
    type: 'connection.update',
    connection,
    sessionId,
    timestamp: new Date().toISOString()
  })
  
  connections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message)
    }
  })
}

// Function to broadcast error messages
export function broadcastError(sessionId: string, errorMessage: string) {
  const connections = qrConnections.get(sessionId) || []
  const message = JSON.stringify({
    type: 'error',
    message: errorMessage,
    sessionId,
    timestamp: new Date().toISOString()
  })
  
  connections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message)
    }
  })
}

// Function to add a new WebSocket connection
export function addQRConnection(sessionId: string, ws: WebSocket) {
  if (!qrConnections.has(sessionId)) {
    qrConnections.set(sessionId, [])
  }
  
  const connections = qrConnections.get(sessionId)!
  connections.push(ws)
  
  // Remove connection when closed
  ws.onclose = () => {
    const index = connections.indexOf(ws)
    if (index > -1) {
      connections.splice(index, 1)
    }
  }
}

// Function to remove all connections for a session
export function removeSessionConnections(sessionId: string) {
  const connections = qrConnections.get(sessionId) || []
  connections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
  })
  qrConnections.delete(sessionId)
}