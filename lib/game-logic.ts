import { GameRoom, Player, Word, Definition, RoundResult } from './types'
import wordsData from '../data/words.json'

export class GameLogic {
  private rooms: Map<string, GameRoom> = new Map()
  private usedWords: Set<string> = new Set()

  createRoom(roomId: string): GameRoom {
    const room: GameRoom = {
      id: roomId,
      state: 'waiting',
      players: [],
      currentRound: 0,
      totalRounds: 3,
      definitions: [],
      roundResults: []
    }
    this.rooms.set(roomId, room)
    return room
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId)
  }

  addPlayer(roomId: string, playerName: string, playerId: string): Player | null {
    const room = this.rooms.get(roomId)
    if (!room || room.state !== 'waiting') return null

    // Verificar se já existe um jogador com o mesmo nome
    if (room.players.some(p => p.name === playerName)) return null

    const player: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      hasSubmittedDefinition: false,
      hasVoted: false
    }

    room.players.push(player)
    return player
  }

  removePlayer(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId)
    if (!room) return false

    room.players = room.players.filter(p => p.id !== playerId)
    return true
  }

  canStartGame(roomId: string): boolean {
    const room = this.rooms.get(roomId)
    return room ? room.players.length >= 2 && room.state === 'waiting' : false
  }

  startGame(roomId: string): Word | null {
    const room = this.rooms.get(roomId)
    if (!room || !this.canStartGame(roomId)) return null

    room.state = 'defining'
    room.currentRound = 1
    
    const word = this.getRandomWord()
    room.currentWord = word
    
    // Reset player states
    room.players.forEach(player => {
      player.hasSubmittedDefinition = false
      player.hasVoted = false
      player.definition = undefined
      player.vote = undefined
    })

    return word
  }

  submitDefinition(roomId: string, playerId: string, definition: string): boolean {
    const room = this.rooms.get(roomId)
    if (!room || room.state !== 'defining') return false

    const player = room.players.find(p => p.id === playerId)
    if (!player || player.hasSubmittedDefinition) return false

    player.definition = definition
    player.hasSubmittedDefinition = true

    // Verificar se todos enviaram definições
    if (room.players.every(p => p.hasSubmittedDefinition)) {
      this.startVotingPhase(roomId)
    }

    return true
  }

  private startVotingPhase(roomId: string): void {
    const room = this.rooms.get(roomId)
    if (!room || !room.currentWord) return

    room.state = 'voting'
    room.definitions = []

    // Adicionar definição correta
    const correctDefinition: Definition = {
      id: 'correct',
      text: room.currentWord.definition,
      isCorrect: true,
      votes: []
    }
    room.definitions.push(correctDefinition)

    // Adicionar definições dos jogadores
    room.players.forEach(player => {
      if (player.definition) {
        const definition: Definition = {
          id: player.id,
          text: player.definition,
          isCorrect: false,
          authorId: player.id,
          votes: []
        }
        room.definitions.push(definition)
      }
    })

    // Embaralhar definições
    room.definitions = this.shuffleArray(room.definitions)

    // Reset voting state
    room.players.forEach(player => {
      player.hasVoted = false
      player.vote = undefined
    })
  }

  submitVote(roomId: string, playerId: string, definitionId: string): boolean {
    const room = this.rooms.get(roomId)
    if (!room || room.state !== 'voting') return false

    const player = room.players.find(p => p.id === playerId)
    if (!player || player.hasVoted) return false

    const definition = room.definitions.find(d => d.id === definitionId)
    if (!definition) return false

    // Remover voto anterior se existir
    if (player.vote) {
      const oldDefinition = room.definitions.find(d => d.id === player.vote)
      if (oldDefinition) {
        oldDefinition.votes = oldDefinition.votes.filter(v => v !== playerId)
      }
    }

    player.vote = definitionId
    player.hasVoted = true
    definition.votes.push(playerId)

    // Verificar se todos votaram
    if (room.players.every(p => p.hasVoted)) {
      this.endRound(roomId)
    }

    return true
  }

  private endRound(roomId: string): void {
    const room = this.rooms.get(roomId)
    if (!room || !room.currentWord) return

    room.state = 'results'

    // Calcular pontos
    const roundScores: { [playerId: string]: number } = {}
    
    room.players.forEach(player => {
      roundScores[player.id] = 0
      
      // 1 ponto por acertar a definição correta
      if (player.vote === 'correct') {
        roundScores[player.id] += 1
      }
      
      // 2 pontos por cada voto na sua definição falsa
      const playerDefinition = room.definitions.find(d => d.authorId === player.id)
      if (playerDefinition) {
        roundScores[player.id] += playerDefinition.votes.length * 2
      }
      
      // Atualizar score total
      player.score += roundScores[player.id]
    })

    // Salvar resultado da rodada
    const roundResult: RoundResult = {
      round: room.currentRound,
      word: room.currentWord,
      definitions: [...room.definitions],
      scores: roundScores
    }
    
    if (!room.roundResults) room.roundResults = []
    room.roundResults.push(roundResult)
  }

  nextRound(roomId: string): Word | null {
    const room = this.rooms.get(roomId)
    if (!room || room.state !== 'results') return null

    if (room.currentRound >= room.totalRounds) {
      room.state = 'finished'
      return null
    }

    room.currentRound++
    room.state = 'defining'
    room.definitions = []
    
    const word = this.getRandomWord()
    room.currentWord = word

    // Reset player states
    room.players.forEach(player => {
      player.hasSubmittedDefinition = false
      player.hasVoted = false
      player.definition = undefined
      player.vote = undefined
    })

    return word
  }

  private getRandomWord(): Word {
    const availableWords = wordsData.words.filter(w => !this.usedWords.has(w.word))
    
    if (availableWords.length === 0) {
      this.usedWords.clear()
      return wordsData.words[Math.floor(Math.random() * wordsData.words.length)]
    }
    
    const word = availableWords[Math.floor(Math.random() * availableWords.length)]
    this.usedWords.add(word.word)
    return word
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  getFinalScores(roomId: string): { [playerId: string]: number } | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    const scores: { [playerId: string]: number } = {}
    room.players.forEach(player => {
      scores[player.id] = player.score
    })
    return scores
  }
}

export const gameLogic = new GameLogic()