import { NextRequest, NextResponse } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
import { createServer } from 'http'

export const runtime = 'nodejs'

// Cache global para o servidor Socket.io
let io: SocketIOServer | undefined
let httpServer: any

function initializeSocketIO() {
  if (io) {
    return io
  }

  console.log('Inicializando Socket.io server...')

  // Criar servidor HTTP para Socket.io
  httpServer = createServer()
  
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    path: '/socket.io/'
  })

  // Configurar eventos do Socket.io
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id)

    socket.on('join-room', ({ roomId, playerName }) => {
      console.log(`Jogador ${playerName} tentando entrar na sala ${roomId}`)
      
      // Entrar na sala
      socket.join(roomId)
      
      // Simular resposta (em produção, usar lógica real do jogo)
      const mockRoom = {
        id: roomId,
        state: 'waiting',
        players: [{ id: socket.id, name: playerName, score: 0 }],
        currentRound: 0,
        totalRounds: 3,
        definitions: []
      }
      
      io?.to(roomId).emit('room-updated', mockRoom)
      io?.to(roomId).emit('player-joined', { id: socket.id, name: playerName, score: 0 })
    })

    socket.on('start-game', (roomId) => {
      console.log(`Iniciando jogo na sala ${roomId}`)
      io?.to(roomId).emit('game-started')
    })

    socket.on('submit-definition', ({ roomId, definition }) => {
      console.log(`Definição enviada na sala ${roomId}:`, definition)
      // Processar definição...
    })

    socket.on('submit-vote', ({ roomId, definitionId }) => {
      console.log(`Voto enviado na sala ${roomId}:`, definitionId)
      // Processar voto...
    })

    socket.on('next-round', (roomId) => {
      console.log(`Próxima rodada na sala ${roomId}`)
      // Processar próxima rodada...
    })

    socket.on('disconnect', (reason) => {
      console.log('Cliente desconectado:', socket.id, 'Razão:', reason)
    })
  })

  console.log('Socket.io server inicializado')
  return io
}

export async function GET(req: NextRequest) {
  try {
    // Inicializar Socket.io se necessário
    const socketIO = initializeSocketIO()
    
    // Verificar se é uma requisição do Socket.io
    const url = new URL(req.url)
    if (url.pathname.includes('/socket.io/')) {
      // Delegar para o Socket.io
      return new Response('Socket.io endpoint', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    }

    return new Response('Socket.io server running', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('Socket.io GET error:', error)
    return new Response('Socket.io server error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Inicializar Socket.io se necessário
    const socketIO = initializeSocketIO()
    
    return new Response(JSON.stringify({ success: true, message: 'Socket.io server running' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Socket.io POST error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}

// Suporte para outros métodos HTTP
export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}