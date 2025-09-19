const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// Preparar aplicação Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Configurar Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    path: '/socket.io/'
  })

  // Armazenamento em memória para as salas
  const gameRooms = new Map()

  // Eventos do Socket.io
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id)

    socket.on('join-room', ({ roomId, playerName }) => {
      console.log(`Jogador ${playerName} tentando entrar na sala ${roomId}`)
      
      // Criar sala se não existir
      if (!gameRooms.has(roomId)) {
        gameRooms.set(roomId, {
          id: roomId,
          state: 'waiting',
          players: [],
          currentRound: 0,
          totalRounds: 3,
          definitions: [],
          currentWord: null,
          roundResults: []
        })
      }

      const room = gameRooms.get(roomId)
      
      // Verificar se o jogador já existe
      const existingPlayer = room.players.find(p => p.name === playerName)
      if (existingPlayer) {
        socket.emit('error', 'Nome já em uso nesta sala')
        return
      }

      // Adicionar jogador
      const player = {
        id: socket.id,
        name: playerName,
        score: 0,
        hasSubmittedDefinition: false,
        hasVoted: false
      }

      room.players.push(player)
      socket.join(roomId)
      
      // Notificar todos na sala
      io.to(roomId).emit('room-updated', room)
      io.to(roomId).emit('player-joined', player)
    })

    socket.on('start-game', (roomId) => {
      console.log(`Iniciando jogo na sala ${roomId}`)
      const room = gameRooms.get(roomId)
      
      if (!room || room.players.length < 2) {
        socket.emit('error', 'Mínimo 2 jogadores necessários')
        return
      }

      room.state = 'defining'
      room.currentRound = 1
      room.definitions = []
      room.currentWord = {
        word: 'Petricor',
        definition: 'O cheiro característico da terra após a chuva'
      }

      // Resetar estado dos jogadores
      room.players.forEach(player => {
        player.hasSubmittedDefinition = false
        player.hasVoted = false
      })

      io.to(roomId).emit('room-updated', room)
      io.to(roomId).emit('game-started')
      io.to(roomId).emit('round-started', room.currentWord)
    })

    socket.on('submit-definition', ({ roomId, definition }) => {
      console.log(`Definição enviada na sala ${roomId}:`, definition)
      const room = gameRooms.get(roomId)
      
      if (!room || room.state !== 'defining') {
        socket.emit('error', 'Estado inválido para enviar definição')
        return
      }

      // Encontrar jogador
      const player = room.players.find(p => p.id === socket.id)
      if (!player) {
        socket.emit('error', 'Jogador não encontrado')
        return
      }

      // Adicionar ou atualizar definição
      const existingIndex = room.definitions.findIndex(d => d.authorId === socket.id)
      if (existingIndex >= 0) {
        room.definitions[existingIndex].text = definition
      } else {
        room.definitions.push({
          id: Date.now().toString(),
          authorId: socket.id,
          text: definition,
          votes: [],
          isCorrect: false
        })
      }

      player.hasSubmittedDefinition = true

      // Verificar se todos enviaram
      const allSubmitted = room.players.every(p => p.hasSubmittedDefinition)
      if (allSubmitted) {
        // Adicionar definição correta
        room.definitions.push({
          id: 'correct-' + Date.now().toString(),
          authorId: 'system',
          text: room.currentWord.definition,
          votes: [],
          isCorrect: true
        })

        // Embaralhar definições
        room.definitions = room.definitions.sort(() => Math.random() - 0.5)
        room.state = 'voting'
        
        io.to(roomId).emit('voting-started', room.definitions)
      }

      io.to(roomId).emit('room-updated', room)
    })

    socket.on('submit-vote', ({ roomId, definitionId }) => {
      console.log(`Voto enviado na sala ${roomId}:`, definitionId)
      const room = gameRooms.get(roomId)
      
      if (!room || room.state !== 'voting') {
        socket.emit('error', 'Estado inválido para votar')
        return
      }

      const player = room.players.find(p => p.id === socket.id)
      if (!player) {
        socket.emit('error', 'Jogador não encontrado')
        return
      }

      // Registrar voto
      const definition = room.definitions.find(d => d.id === definitionId)
      if (definition) {
        definition.votes.push(socket.id)
        player.hasVoted = true

        // Calcular pontos se votou na definição correta
        if (definition.isCorrect) {
          player.score += 10
        } else {
          // Dar pontos para o autor da definição votada
          const author = room.players.find(p => p.id === definition.authorId)
          if (author) {
            author.score += 5
          }
        }
      }

      // Verificar se todos votaram
      const allVoted = room.players.every(p => p.hasVoted)
      if (allVoted) {
        room.state = 'results'
        
        const roundResult = {
          round: room.currentRound,
          word: room.currentWord,
          definitions: room.definitions,
          scores: room.players.reduce((acc, p) => {
            acc[p.id] = p.score
            return acc
          }, {})
        }

        if (!room.roundResults) room.roundResults = []
        room.roundResults.push(roundResult)

        io.to(roomId).emit('round-ended', roundResult)
      }

      io.to(roomId).emit('room-updated', room)
    })

    socket.on('next-round', (roomId) => {
      console.log(`Próxima rodada na sala ${roomId}`)
      const room = gameRooms.get(roomId)
      
      if (!room) {
        socket.emit('error', 'Sala não encontrada')
        return
      }

      if (room.currentRound >= room.totalRounds) {
        // Jogo terminou
        room.state = 'finished'
        const finalScores = room.players
          .sort((a, b) => b.score - a.score)
          .map(p => ({ name: p.name, score: p.score }))
        
        io.to(roomId).emit('game-ended', finalScores)
      } else {
        // Próxima rodada
        room.currentRound++
        room.state = 'defining'
        room.definitions = []
        room.currentWord = {
          word: 'Serendipidade',
          definition: 'A capacidade de fazer descobertas felizes por acaso'
        }

        // Resetar estado dos jogadores
        room.players.forEach(player => {
          player.hasSubmittedDefinition = false
          player.hasVoted = false
        })

        io.to(roomId).emit('round-started', room.currentWord)
      }

      io.to(roomId).emit('room-updated', room)
    })

    socket.on('disconnect', (reason) => {
      console.log('Cliente desconectado:', socket.id, 'Razão:', reason)
      
      // Remover jogador das salas
      for (const [roomId, room] of gameRooms.entries()) {
        const playerIndex = room.players.findIndex(p => p.id === socket.id)
        if (playerIndex >= 0) {
          room.players.splice(playerIndex, 1)
          io.to(roomId).emit('room-updated', room)
          io.to(roomId).emit('player-left', socket.id)
          
          // Remover sala se vazia
          if (room.players.length === 0) {
            gameRooms.delete(roomId)
          }
        }
      }
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log('> Socket.io server running')
    })
})