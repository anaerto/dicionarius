import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { gameLogic } from './game-logic'
import { SocketEvents } from './types'

export function initializeSocket(server: HTTPServer) {
  const io = new SocketIOServer<SocketEvents>(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  })

  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id)

    socket.on('join-room', ({ roomId, playerName }) => {
      try {
        // Criar sala se não existir
        let room = gameLogic.getRoom(roomId)
        if (!room) {
          room = gameLogic.createRoom(roomId)
        }

        // Adicionar jogador
        const player = gameLogic.addPlayer(roomId, playerName, socket.id)
        if (!player) {
          socket.emit('error', 'Não foi possível entrar na sala. Nome já em uso ou jogo em andamento.')
          return
        }

        // Entrar na sala do Socket.io
        socket.join(roomId)

        // Notificar todos na sala
        io.to(roomId).emit('room-updated', room)
        io.to(roomId).emit('player-joined', player)

        console.log(`Jogador ${playerName} entrou na sala ${roomId}`)
      } catch (error) {
        console.error('Erro ao entrar na sala:', error)
        socket.emit('error', 'Erro interno do servidor')
      }
    })

    socket.on('start-game', (roomId) => {
      try {
        if (!gameLogic.canStartGame(roomId)) {
          socket.emit('error', 'Não é possível iniciar o jogo. Mínimo 2 jogadores necessários.')
          return
        }

        const word = gameLogic.startGame(roomId)
        if (!word) {
          socket.emit('error', 'Erro ao iniciar o jogo')
          return
        }

        const room = gameLogic.getRoom(roomId)
        if (room) {
          io.to(roomId).emit('room-updated', room)
          io.to(roomId).emit('game-started')
          io.to(roomId).emit('round-started', word)
        }

        console.log(`Jogo iniciado na sala ${roomId}`)
      } catch (error) {
        console.error('Erro ao iniciar jogo:', error)
        socket.emit('error', 'Erro interno do servidor')
      }
    })

    socket.on('submit-definition', ({ roomId, definition }) => {
      try {
        const success = gameLogic.submitDefinition(roomId, socket.id, definition)
        if (!success) {
          socket.emit('error', 'Não foi possível enviar a definição')
          return
        }

        const room = gameLogic.getRoom(roomId)
        if (room) {
          io.to(roomId).emit('room-updated', room)
          
          // Se todos enviaram, iniciar votação
          if (room.state === 'voting') {
            io.to(roomId).emit('voting-started', room.definitions)
          }
        }

        console.log(`Definição enviada por ${socket.id} na sala ${roomId}`)
      } catch (error) {
        console.error('Erro ao enviar definição:', error)
        socket.emit('error', 'Erro interno do servidor')
      }
    })

    socket.on('submit-vote', ({ roomId, definitionId }) => {
      try {
        const success = gameLogic.submitVote(roomId, socket.id, definitionId)
        if (!success) {
          socket.emit('error', 'Não foi possível enviar o voto')
          return
        }

        const room = gameLogic.getRoom(roomId)
        if (room) {
          io.to(roomId).emit('room-updated', room)
          
          // Se todos votaram, mostrar resultados
          if (room.state === 'results' && room.roundResults) {
            const lastResult = room.roundResults[room.roundResults.length - 1]
            io.to(roomId).emit('round-ended', lastResult)
          }
        }

        console.log(`Voto enviado por ${socket.id} na sala ${roomId}`)
      } catch (error) {
        console.error('Erro ao enviar voto:', error)
        socket.emit('error', 'Erro interno do servidor')
      }
    })

    socket.on('next-round', (roomId) => {
      try {
        const word = gameLogic.nextRound(roomId)
        const room = gameLogic.getRoom(roomId)
        
        if (!room) {
          socket.emit('error', 'Sala não encontrada')
          return
        }

        io.to(roomId).emit('room-updated', room)

        if (word) {
          // Próxima rodada
          io.to(roomId).emit('round-started', word)
        } else {
          // Jogo terminou
          const finalScores = gameLogic.getFinalScores(roomId)
          if (finalScores) {
            io.to(roomId).emit('game-ended', finalScores)
          }
        }

        console.log(`Próxima rodada iniciada na sala ${roomId}`)
      } catch (error) {
        console.error('Erro ao iniciar próxima rodada:', error)
        socket.emit('error', 'Erro interno do servidor')
      }
    })

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id)
      
      // Remover jogador de todas as salas
      // Nota: Em uma implementação mais robusta, você manteria um mapeamento de socket.id para roomId
      // Por simplicidade, vamos apenas logar a desconexão
    })
  })

  return io
}