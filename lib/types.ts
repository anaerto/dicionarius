export interface Player {
  id: string
  name: string
  score: number
  hasSubmittedDefinition: boolean
  hasVoted: boolean
  definition?: string
  vote?: string
}

export interface Word {
  word: string
  definition: string
}

export interface Definition {
  id: string
  text: string
  isCorrect: boolean
  authorId?: string
  votes: string[]
}

export type GameState = 'waiting' | 'defining' | 'voting' | 'results' | 'finished'

export interface GameRoom {
  id: string
  state: GameState
  players: Player[]
  currentRound: number
  totalRounds: number
  currentWord?: Word
  definitions: Definition[]
  roundResults?: RoundResult[]
}

export interface RoundResult {
  round: number
  word: Word
  definitions: Definition[]
  scores: { [playerId: string]: number }
}

export interface SocketEvents {
  // Client to Server
  'join-room': (data: { roomId: string; playerName: string }) => void
  'start-game': (roomId: string) => void
  'submit-definition': (data: { roomId: string; definition: string }) => void
  'submit-vote': (data: { roomId: string; definitionId: string }) => void
  'next-round': (roomId: string) => void

  // Server to Client
  'room-updated': (room: GameRoom) => void
  'error': (message: string) => void
  'player-joined': (player: Player) => void
  'game-started': () => void
  'round-started': (word: Word) => void
  'voting-started': (definitions: Definition[]) => void
  'round-ended': (result: RoundResult) => void
  'game-ended': (finalScores: { [playerId: string]: number }) => void
}