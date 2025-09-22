import { NextRequest } from 'next/server'

// Store active SSE connections for QR updates
const sseConnections = new Map<string, Response[]>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')
  
  if (!sessionId) {
    return new Response('Session ID is required', { status: 400 })
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({
        type: 'connected',
        sessionId,
        timestamp: new Date().toISOString()
      })}\n\n`
      controller.enqueue(new TextEncoder().encode(data))

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          const heartbeatData = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`
          controller.enqueue(new TextEncoder().encode(heartbeatData))
        } catch (error) {
          clearInterval(heartbeat)
          controller.close()
        }
      }, 30000) // 30 seconds

      // Store connection for broadcasting
      if (!sseConnections.has(sessionId)) {
        sseConnections.set(sessionId, [])
      }

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        // Remove this connection from the map
        const connections = sseConnections.get(sessionId) || []
        const index = connections.findIndex(conn => conn === response)
        if (index > -1) {
          connections.splice(index, 1)
        }
        controller.close()
      })
    },
  })

  const response = new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })

  return response
}

// Function to broadcast QR code updates to SSE connections
export function broadcastQRUpdate(sessionId: string, qrCode: string) {
  // This would be called from the WhatsApp bot when QR is generated
  // For now, we'll implement a simple polling mechanism in the client
  console.log(`QR update for session ${sessionId}:`, qrCode.substring(0, 50) + '...')
}

// Function to broadcast connection status updates
export function broadcastConnectionUpdate(sessionId: string, connection: string) {
  console.log(`Connection update for session ${sessionId}:`, connection)
}