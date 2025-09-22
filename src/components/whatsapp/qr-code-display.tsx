'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QrCode, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

interface QRCodeDisplayProps {
  sessionId: string
  onQRScanned?: () => void
  onConnectionStatusChange?: (connected: boolean) => void
}

export default function QRCodeDisplay({ 
  sessionId, 
  onQRScanned, 
  onConnectionStatusChange 
}: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [statusMessage, setStatusMessage] = useState('Ready to connect')
  const [retryCount, setRetryCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [qrTimeout, setQrTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Initialize Socket.IO connection for real-time QR updates
    const newSocket = io('http://localhost:3000', {
      path: '/api/socketio',
      transports: ['websocket', 'polling']
    })
    
    setSocket(newSocket)
    
    newSocket.on('connect', () => {
      console.log('Socket.IO connected for QR updates')
      // Subscribe to the specific session
      newSocket.emit('subscribe', sessionId)
    })

    newSocket.on('qr', (data) => {
      console.log('QR code received:', data)
      setQrCode(data.qr)
      setConnectionStatus('connecting')
      setStatusMessage('Please scan the QR code with WhatsApp')
      setLastUpdated(new Date())
    })

    newSocket.on('connection.update', (data) => {
      console.log('Connection update:', data)
      if (data.connection === 'open') {
        setConnectionStatus('connected')
        setStatusMessage('Successfully connected to WhatsApp!')
        setQrCode(null)
        onConnectionStatusChange?.(true)
        onQRScanned?.()
      } else if (data.connection === 'close') {
        setConnectionStatus('disconnected')
        setStatusMessage('Connection closed')
        setQrCode(null)
        onConnectionStatusChange?.(false)
      } else if (data.connection === 'connecting') {
        setConnectionStatus('connecting')
        setStatusMessage('Connecting to WhatsApp...')
      }
    })

    newSocket.on('error', (data) => {
      console.error('Socket error:', data)
      setConnectionStatus('error')
      setStatusMessage(data.message || 'Connection error')
    })

    newSocket.on('status', (data) => {
      console.log('Status update:', data)
    })

    newSocket.on('disconnect', () => {
      console.log('Socket.IO disconnected')
      if (connectionStatus === 'connecting') {
        setConnectionStatus('disconnected')
        setStatusMessage('Connection lost')
      }
    })

    return () => {
      if (newSocket) {
        newSocket.emit('unsubscribe', sessionId)
        newSocket.disconnect()
      }
    }
  }, [sessionId, connectionStatus, onConnectionStatusChange, onQRScanned])

  // Auto-request QR code on component mount if no QR is available
  useEffect(() => {
    if (!qrCode && connectionStatus === 'disconnected') {
      const timer = setTimeout(() => {
        requestNewQR()
      }, 500) // Small delay to ensure socket is connected
      
      return () => clearTimeout(timer)
    }
  }, [qrCode, connectionStatus])

  // Set up QR generation timeout
  useEffect(() => {
    if (connectionStatus === 'connecting' && !qrCode) {
      // Clear any existing timeout
      if (qrTimeout) {
        clearTimeout(qrTimeout)
      }
      
      // Set new timeout for 10 seconds
      const timeout = setTimeout(() => {
        setStatusMessage('QR generation taking longer than expected. Trying again...')
        requestNewQR()
      }, 10000)
      
      setQrTimeout(timeout)
      
      return () => {
        if (timeout) {
          clearTimeout(timeout)
        }
      }
    } else if (qrCode || connectionStatus !== 'connecting') {
      // Clear timeout if we have QR or not in connecting state
      if (qrTimeout) {
        clearTimeout(qrTimeout)
        setQrTimeout(null)
      }
    }
  }, [connectionStatus, qrCode])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (qrTimeout) {
        clearTimeout(qrTimeout)
      }
    }
  }, [qrTimeout])

  const requestNewQR = async () => {
    try {
      setConnectionStatus('connecting')
      setStatusMessage('Generating QR code...')
      
      // First try to get cached QR immediately
      const cachedResponse = await fetch(`/api/whatsapp?action=qr&sessionId=${sessionId}`)
      const cachedData = await cachedResponse.json()
      
      if (cachedData.success && cachedData.qr) {
        // Use cached QR code immediately
        setQrCode(cachedData.qr)
        setConnectionStatus('connecting')
        setStatusMessage('Please scan the QR code with WhatsApp')
        setLastUpdated(new Date())
        setRetryCount(prev => prev + 1)
        return
      }
      
      // Force QR generation if no cached QR
      const forceResponse = await fetch(`/api/whatsapp?action=force-qr&sessionId=${sessionId}`)
      const forceData = await forceResponse.json()
      
      if (forceData.success) {
        setRetryCount(prev => prev + 1)
        setStatusMessage('QR code generation forced - waiting for QR code...')
      } else {
        setStatusMessage('Failed to generate QR code: ' + (forceData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error requesting new QR:', error)
      setStatusMessage('Failed to request QR code')
    }
  }

  const reinitializeSession = async () => {
    try {
      setStatusMessage('Reinitializing session...')
      setConnectionStatus('connecting')
      
      const response = await fetch('/api/whatsapp?action=reinitialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId,
          autoReply: true,
          aiEnabled: true,
          authorizedNumbers: []
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setRetryCount(0)
        setStatusMessage('Session reinitialized. Waiting for QR code...')
      } else {
        setConnectionStatus('error')
        setStatusMessage('Failed to reinitialize: ' + data.error)
      }
    } catch (error) {
      console.error('Error reinitializing session:', error)
      setConnectionStatus('error')
      setStatusMessage('Error reinitializing session')
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'connecting':
        return <QrCode className="h-5 w-5 text-blue-500 animate-pulse" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <QrCode className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-50 border-green-200'
      case 'connecting':
        return 'bg-blue-50 border-blue-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <Card className={`transition-all duration-300 ${getStatusColor()}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          WhatsApp QR Code
        </CardTitle>
        <CardDescription>
          Scan this QR code with WhatsApp to connect your bot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Bar */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div className="flex items-center gap-2">
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
              {connectionStatus.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {statusMessage}
            </span>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* QR Code Display */}
        <div className="flex justify-center p-6 bg-white rounded-lg border">
          {qrCode ? (
            <div className="space-y-4">
              <img 
                src={qrCode} 
                alt="WhatsApp QR Code" 
                className="w-64 h-64 border-2 border-gray-200 rounded-lg"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Open WhatsApp → Linked Devices → Link a Device
                </p>
                <Button 
                  onClick={requestNewQR} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh QR Code
                </Button>
              </div>
            </div>
          ) : connectionStatus === 'connected' ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-24 w-24 text-green-500 mx-auto" />
              <div>
                <p className="text-lg font-medium text-green-700">
                  Successfully Connected!
                </p>
                <p className="text-sm text-muted-foreground">
                  Your WhatsApp bot is now active and ready to receive commands
                </p>
              </div>
            </div>
          ) : connectionStatus === 'connecting' ? (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-blue-500 mx-auto"></div>
              <div>
                <p className="text-lg font-medium text-blue-700">
                  Generating QR Code...
                </p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we prepare your connection
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  ⚡ This should take less than 3 seconds with our optimizations
                </p>
                <p className="text-xs text-muted-foreground">
                  If it takes longer, we'll automatically retry
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <QrCode className="h-24 w-24 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Ready to Connect
                </p>
                <p className="text-sm text-muted-foreground">
                  Click "Generate QR Code" to start the connection process
                </p>
              </div>
              <div className="space-y-3">
                <Button onClick={requestNewQR}>
                  Generate QR Code
                </Button>
                <Button 
                  variant="outline" 
                  onClick={reinitializeSession}
                  className="w-full"
                >
                  Force Reinitialize Session
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">How to connect:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Open WhatsApp on your phone</li>
            <li>Go to Settings → Linked Devices</li>
            <li>Tap "Link a Device"</li>
            <li>Point your camera at the QR code above</li>
            <li>Wait for the connection to establish</li>
          </ol>
        </div>

        {/* Retry Information */}
        {retryCount > 0 && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Retry attempts: {retryCount}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}