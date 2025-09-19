import { NextRequest, NextResponse } from 'next/server'

// Armazenamento em memória para as salas (em produção, usar banco de dados)
const gameRooms = new Map()

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const roomId = params.roomId
  
  try {
    const room = gameRooms.get(roomId)
    
    if (!room) {
      return NextResponse.json({ error: 'Sala não encontrada' }, { status: 404 })
    }
    
    return NextResponse.json({ room })
  } catch (error) {
    console.error('Erro ao buscar sala:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const roomId = params.roomId
  
  try {
    const body = await request.json()
    const { action, playerName, playerId, definition, vote } = body
    
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
        votes: [],
        roundResults: []
      })
    }
    
    const room = gameRooms.get(roomId)
    
    switch (action) {
      case 'join':
        // Verificar se jogador já existe
        const existingPlayer = room.players.find((p: any) => p.name === playerName)
        if (existingPlayer) {
          return NextResponse.json({ 
            success: true, 
            room, 
            playerId: existingPlayer.id 
          })
        }
        
        // Adicionar novo jogador
        const newPlayer = {
          id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: playerName,
          score: 0,
          isHost: room.players.length === 0
        }
        
        room.players.push(newPlayer)
        gameRooms.set(roomId, room)
        
        return NextResponse.json({ 
          success: true, 
          room, 
          playerId: newPlayer.id 
        })
        
      case 'start-game':
        if (room.players.length < 2) {
          return NextResponse.json({ 
            error: 'Mínimo 2 jogadores necessários' 
          }, { status: 400 })
        }
        
        // Iniciar jogo
        room.state = 'defining'
        room.currentRound = 1
        room.currentWord = getRandomWord()
        room.definitions = []
        room.votes = []
        
        gameRooms.set(roomId, room)
        
        return NextResponse.json({ success: true, room })
        
      case 'submit-definition':
        if (room.state !== 'defining') {
          return NextResponse.json({ 
            error: 'Não é possível enviar definição agora' 
          }, { status: 400 })
        }
        
        // Adicionar definição
        const newDefinition = {
          id: `def_${Date.now()}`,
          playerId,
          text: definition,
          votes: 0
        }
        
        room.definitions.push(newDefinition)
        
        // Verificar se todos enviaram definições
        if (room.definitions.length === room.players.length) {
          room.state = 'voting'
        }
        
        gameRooms.set(roomId, room)
        
        return NextResponse.json({ success: true, room })
        
      case 'submit-vote':
        if (room.state !== 'voting') {
          return NextResponse.json({ 
            error: 'Não é possível votar agora' 
          }, { status: 400 })
        }
        
        // Adicionar voto
        const existingVote = room.votes.find((v: any) => v.playerId === playerId)
        if (existingVote) {
          existingVote.definitionId = vote
        } else {
          room.votes.push({ playerId, definitionId: vote })
        }
        
        // Verificar se todos votaram
        if (room.votes.length === room.players.length) {
          // Calcular resultados
          calculateRoundResults(room)
          
          if (room.currentRound >= room.totalRounds) {
            room.state = 'finished'
          } else {
            room.state = 'results'
          }
        }
        
        gameRooms.set(roomId, room)
        
        return NextResponse.json({ success: true, room })
        
      case 'next-round':
        if (room.currentRound >= room.totalRounds) {
          room.state = 'finished'
        } else {
          room.currentRound++
          room.state = 'defining'
          room.currentWord = getRandomWord()
          room.definitions = []
          room.votes = []
        }
        
        gameRooms.set(roomId, room)
        
        return NextResponse.json({ success: true, room })
        
      default:
        return NextResponse.json({ 
          error: 'Ação não reconhecida' 
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Erro na API do jogo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

function getRandomWord(): string {
  const words = [
    'Serendipidade', 'Efêmero', 'Melancolia', 'Nostalgia', 'Saudade',
    'Resiliência', 'Empatia', 'Altruísmo', 'Perspicácia', 'Eloquência'
  ]
  return words[Math.floor(Math.random() * words.length)]
}

function calculateRoundResults(room: any) {
  // Contar votos para cada definição
  room.definitions.forEach((def: any) => {
    def.votes = room.votes.filter((vote: any) => vote.definitionId === def.id).length
  })
  
  // Atualizar pontuação dos jogadores
  room.definitions.forEach((def: any) => {
    const player = room.players.find((p: any) => p.id === def.playerId)
    if (player) {
      player.score += def.votes * 10 // 10 pontos por voto
    }
  })
  
  // Salvar resultado da rodada
  room.roundResults.push({
    round: room.currentRound,
    word: room.currentWord,
    definitions: [...room.definitions],
    votes: [...room.votes]
  })
}