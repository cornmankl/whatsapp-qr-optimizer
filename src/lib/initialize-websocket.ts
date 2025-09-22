// Initialize WebSocket server for WhatsApp QR code broadcasting
import { whatsappQRWebSocketServer } from './websocket-server'

// Initialize the WebSocket server when this module is imported
console.log('Initializing WhatsApp QR WebSocket server...')
const serverStatus = whatsappQRWebSocketServer.getStatus()
console.log('WebSocket server status:', serverStatus)

export default whatsappQRWebSocketServer