import { NextRequest, NextResponse } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
import { Server as NetServer } from 'http'
import { initializeSocket } from '@/lib/socket-server'

// Global para manter a instância do Socket.io
declare global {
  var io: SocketIOServer | undefined
}

export async function GET(req: NextRequest) {
  if (!global.io) {
    console.log('Inicializando servidor Socket.io para Vercel...')
    
    // Para Vercel, precisamos usar uma abordagem diferente
    const httpServer = req.nextUrl.origin
    
    // Criar instância Socket.io compatível com Vercel
    global.io = new SocketIOServer({
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: ['polling', 'websocket']
    })
    
    // Inicializar lógica do jogo
    initializeSocket(global.io as any)
    
    console.log('Servidor Socket.io inicializado para Vercel')
  }

  return NextResponse.json({ message: 'Socket.io server running' })
}

export async function POST(req: NextRequest) {
  return GET(req)
}