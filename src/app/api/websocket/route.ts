import { NextRequest } from "next/server"
import { WebSocketServer } from "ws"
import { activityLogger } from "@/lib/activity-logger"

// WebSocket server instance
let wss: WebSocketServer | null = null

export async function GET(request: NextRequest) {
  if (!wss) {
    // Create WebSocket server
    wss = new WebSocketServer({ 
      port: 8080,
      perMessageDeflate: false 
    })

    wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection established')
      
      // Add client to activity logger
      activityLogger.addWebSocketClient(ws)

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to audit tracker alerts',
        timestamp: new Date().toISOString()
      }))

      // Handle incoming messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString())
          console.log('Received WebSocket message:', data)
          
          // Handle different message types
          switch (data.type) {
            case 'ping':
              ws.send(JSON.stringify({
                type: 'pong',
                timestamp: new Date().toISOString()
              }))
              break
            case 'subscribe':
              // Handle subscription to specific alert types
              ws.send(JSON.stringify({
                type: 'subscribed',
                alertTypes: data.alertTypes || ['all'],
                timestamp: new Date().toISOString()
              }))
              break
            default:
              console.log('Unknown message type:', data.type)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      })

      // Handle connection close
      ws.on('close', () => {
        console.log('WebSocket connection closed')
      })

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error)
      })
    })

    console.log('WebSocket server started on port 8080')
  }

  return new Response('WebSocket server is running', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

// Cleanup function
export async function DELETE() {
  if (wss) {
    wss.close()
    wss = null
    console.log('WebSocket server stopped')
  }
  
  return new Response('WebSocket server stopped', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
