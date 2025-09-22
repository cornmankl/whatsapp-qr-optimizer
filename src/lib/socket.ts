import { Server } from 'socket.io';

// Store session subscriptions and socket references
const sessionSubscriptions = new Map<string, Set<any>>();
let ioInstance: Server | null = null;

export const setupSocket = (io: Server) => {
  ioInstance = io;
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle WhatsApp QR session subscription
    socket.on('subscribe', (sessionId: string) => {
      console.log(`Client ${socket.id} subscribed to WhatsApp session ${sessionId}`);
      
      if (!sessionSubscriptions.has(sessionId)) {
        sessionSubscriptions.set(sessionId, new Set());
      }
      
      sessionSubscriptions.get(sessionId)!.add(socket);
      
      // Send current status if available
      socket.emit('status', {
        type: 'subscribed',
        sessionId,
        message: 'Successfully subscribed to WhatsApp QR updates'
      });
    });

    // Handle WhatsApp QR session unsubscription
    socket.on('unsubscribe', (sessionId: string) => {
      console.log(`Client ${socket.id} unsubscribed from WhatsApp session ${sessionId}`);
      
      const sessionSubscribers = sessionSubscriptions.get(sessionId);
      if (sessionSubscribers) {
        sessionSubscribers.delete(socket);
        
        if (sessionSubscribers.size === 0) {
          sessionSubscriptions.delete(sessionId);
        }
      }
    });

    // Handle messages
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message only the client who send the message
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Remove from all session subscriptions
      for (const [sessionId, subscribers] of sessionSubscriptions.entries()) {
        subscribers.delete(socket);
        if (subscribers.size === 0) {
          sessionSubscriptions.delete(sessionId);
        }
      }
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to WebSocket Echo Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};

// Helper functions to broadcast WhatsApp QR updates
export function broadcastWhatsAppQR(sessionId: string, qrCode: string) {
  if (!ioInstance) return;
  
  const subscribers = sessionSubscriptions.get(sessionId);
  if (subscribers) {
    const message = {
      type: 'qr',
      qr: qrCode,
      sessionId,
      timestamp: new Date().toISOString()
    };
    
    subscribers.forEach(socket => {
      socket.emit('qr', message);
    });
    
    console.log(`QR code broadcasted to ${subscribers.size} clients for session ${sessionId}`);
  }
}

export function broadcastWhatsAppConnectionUpdate(sessionId: string, connection: string) {
  if (!ioInstance) return;
  
  const subscribers = sessionSubscriptions.get(sessionId);
  if (subscribers) {
    const message = {
      type: 'connection.update',
      connection,
      sessionId,
      timestamp: new Date().toISOString()
    };
    
    subscribers.forEach(socket => {
      socket.emit('connection.update', message);
    });
    
    console.log(`Connection status broadcasted to ${subscribers.size} clients for session ${sessionId}`);
  }
}

export function broadcastWhatsAppError(sessionId: string, errorMessage: string) {
  if (!ioInstance) return;
  
  const subscribers = sessionSubscriptions.get(sessionId);
  if (subscribers) {
    const message = {
      type: 'error',
      message: errorMessage,
      sessionId,
      timestamp: new Date().toISOString()
    };
    
    subscribers.forEach(socket => {
      socket.emit('error', message);
    });
    
    console.log(`Error broadcasted to ${subscribers.size} clients for session ${sessionId}`);
  }
}