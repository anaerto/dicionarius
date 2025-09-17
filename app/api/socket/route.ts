import { NextRequest } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
import { createServer } from 'http'
import { initializeSocket } from '@/lib/socket-server'

let io: SocketIOServer | undefined

export async function GET(req: NextRequest) {
  if (!io) {
    console.log('Inicializando servidor Socket.io...')
    
    // Criar servidor HTTP
    const httpServer = createServer()
    
    // Inicializar Socket.io
    io = initializeSocket(httpServer)
    
    console.log('Servidor Socket.io inicializado')
  }

  return new Response('Socket.io server running', { status: 200 })
}

export async function POST(req: NextRequest) {
  return GET(req)
}