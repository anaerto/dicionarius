import { NextRequest, NextResponse } from 'next/server'
import { GameRoom, Player } from '@/lib/types'

// Armazenamento em memória (em produção, usar Redis ou banco de dados)
const gameRooms = new Map<string, GameRoom>()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  
  if (!roomId) {
    return NextResponse.json({ error: 'Room ID required' }, { status: 400 })
  }
  
  const room = gameRooms.get(roomId)
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }
  
  return NextResponse.json(room)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, roomId, playerName, playerId, definition, vote } = body
    
    switch (action) {
      case 'create-room':
        return createRoom(roomId)
      
      case 'join-room':
        return joinRoom(roomId, playerName)
      
      case 'submit-definition':
        return submitDefinition(roomId, playerId, definition)
      
      case 'submit-vote':
        return submitVote(roomId, playerId, vote)
      
      case 'start-game':
        return startGame(roomId)
      
      case 'next-round':
        return nextRound(roomId)
      
      case 'restart-game':
        return restartGame(roomId)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Game API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function createRoom(roomId: string) {
  const room: GameRoom = {
    id: roomId,
    state: 'waiting',
    players: [],
    currentRound: 0,
    totalRounds: 3,
    definitions: []
  }
  
  gameRooms.set(roomId, room)
  return NextResponse.json(room)
}

function joinRoom(roomId: string, playerName: string) {
  const room = gameRooms.get(roomId)
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }
  
  if (room.players.length >= 4) {
    return NextResponse.json({ error: 'Room is full' }, { status: 400 })
  }
  
  if (room.players.some(p => p.name === playerName)) {
    return NextResponse.json({ error: 'Name already taken' }, { status: 400 })
  }
  
  const player: Player = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: playerName,
    score: 0,
    hasSubmittedDefinition: false,
    hasVoted: false
  }
  
  room.players.push(player)
  gameRooms.set(roomId, room)
  
  return NextResponse.json({ room, playerId: player.id })
}

function submitDefinition(roomId: string, playerId: string, definition: string) {
  const room = gameRooms.get(roomId)
  if (!room || room.state !== 'defining') {
    return NextResponse.json({ error: 'Invalid room state' }, { status: 400 })
  }
  
  const existingIndex = room.definitions.findIndex(d => d.authorId === playerId)
  if (existingIndex >= 0) {
    room.definitions[existingIndex].text = definition
  } else {
    room.definitions.push({
      id: Date.now().toString(),
      authorId: playerId,
      text: definition,
      votes: [],
      isCorrect: false
    })
  }
  
  // Verificar se todos enviaram definições
  if (room.definitions.length === room.players.length) {
    // Adicionar definição correta às opções de voto
    if (room.currentWord && !room.definitions.find(d => d.isCorrect)) {
      room.definitions.push({
        id: 'correct-' + Date.now().toString(),
        authorId: 'system',
        text: room.currentWord.definition,
        votes: [],
        isCorrect: true
      })
    }
    
    // Embaralhar as definições para que a correta não apareça sempre na mesma posição
    room.definitions = room.definitions.sort(() => Math.random() - 0.5)
    
    room.state = 'voting'
  }
  
  gameRooms.set(roomId, room)
  return NextResponse.json(room)
}

function submitVote(roomId: string, playerId: string, vote: string) {
  const room = gameRooms.get(roomId)
  if (!room || room.state !== 'voting') {
    return NextResponse.json({ error: 'Invalid room state' }, { status: 400 })
  }
  
  // Remover voto anterior se existir
  room.definitions.forEach(def => {
    def.votes = def.votes.filter(v => v !== playerId)
  })
  
  // Adicionar novo voto
  const definition = room.definitions.find(d => d.id === vote)
  if (definition) {
    definition.votes.push(playerId)
  }
  
  // Marcar jogador como tendo votado
  const player = room.players.find(p => p.id === playerId)
  if (player) {
    player.hasVoted = true
  }
  
  // Verificar se todos votaram
  const allVoted = room.players.every(p => p.hasVoted)
  if (allVoted) {
    room.state = 'results'
    calculateScores(room)
  }
  
  gameRooms.set(roomId, room)
  return NextResponse.json(room)
}

function startGame(roomId: string) {
  const room = gameRooms.get(roomId)
  if (!room || room.players.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 })
  }
  
  room.state = 'defining'
  room.currentRound = 1
  room.definitions = []
  
  // Adicionar palavra aleatória (simplificado)
  room.currentWord = {
    word: 'Petricor',
    definition: 'O cheiro característico da terra após a chuva'
  }
  
  gameRooms.set(roomId, room)
  return NextResponse.json(room)
}

function nextRound(roomId: string) {
  const room = gameRooms.get(roomId)
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }
  
  if (room.currentRound >= room.totalRounds) {
    room.state = 'finished'
  } else {
    room.currentRound++
    room.state = 'defining'
    room.definitions = []
    
    // Resetar estado dos jogadores para nova rodada
    room.players.forEach(player => {
      player.hasVoted = false
    })
    
    // Nova palavra (simplificado)
    const words = [
      { id: '1', word: 'Petricor', definition: 'O cheiro característico da terra após a chuva' },
      { id: '2', word: 'Saudade', definition: 'Sentimento de nostalgia e melancolia' },
      { id: '3', word: 'Serendipidade', definition: 'Descoberta feliz e inesperada' }
    ]
    room.currentWord = words[room.currentRound - 1] || words[0]
  }
  
  gameRooms.set(roomId, room)
  return NextResponse.json(room)
}

function restartGame(roomId: string) {
  const room = gameRooms.get(roomId)
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }
  
  // Resetar sala mantendo os jogadores
  room.state = 'waiting'
  room.currentRound = 0
  room.definitions = []
  room.currentWord = undefined
  room.roundResults = []
  
  // Resetar estado dos jogadores
  room.players.forEach(player => {
    player.score = 0
    player.hasSubmittedDefinition = false
    player.hasVoted = false
  })
  
  gameRooms.set(roomId, room)
  return NextResponse.json(room)
}

function calculateScores(room: GameRoom) {
  if (!room.currentWord) return
  
  // Adicionar definição correta se não existir
  const correctDefinition = {
    id: 'correct',
    authorId: 'system',
    text: room.currentWord.definition,
    votes: [],
    isCorrect: true
  }
  
  if (!room.definitions.find(d => d.isCorrect)) {
    room.definitions.push(correctDefinition)
  }
  
  // Calcular pontuações
  room.players.forEach(player => {
    // 1 ponto por acertar a definição correta
    const correctDef = room.definitions.find(d => d.isCorrect)
    if (correctDef?.votes.includes(player.id)) {
      player.score += 1
    }
    
    // 2 pontos por cada voto na sua definição falsa (exceto o próprio voto)
    const playerDef = room.definitions.find(d => d.authorId === player.id)
    if (playerDef) {
      // Filtrar votos para excluir o voto do próprio jogador
      const validVotes = playerDef.votes.filter(voterId => voterId !== player.id)
      player.score += validVotes.length * 2
    }
  })
}