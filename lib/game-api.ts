import { useState, useEffect, useCallback, useRef } from 'react'
import { GameRoom } from './types'

export function useGameAPI(roomId: string) {
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  // Função para buscar estado da sala
  const fetchRoom = useCallback(async () => {
    try {
      const response = await fetch(`/api/game/${roomId}`)
      
      if (response.ok) {
        const data = await response.json()
        setRoom(data.room)
        setError(null)
      } else if (response.status === 404) {
        // Sala não existe ainda, isso é normal
        setRoom(null)
      } else {
        throw new Error('Erro ao buscar sala')
      }
    } catch (err) {
      console.error('Erro ao buscar sala:', err)
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [roomId])

  // Função para enviar ação para a API
  const sendAction = useCallback(async (action: string, data: any = {}) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/game/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...data,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setRoom(result.room)
        
        // Se for uma ação de join, salvar o playerId
        if (action === 'join' && result.playerId) {
          setPlayerId(result.playerId)
        }
        
        return result
      } else {
        throw new Error(result.error || 'Erro na ação')
      }
    } catch (err) {
      console.error('Erro ao enviar ação:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      throw err
    }
  }, [roomId])

  // Iniciar polling quando componente monta
  useEffect(() => {
    fetchRoom()

    // Configurar polling para atualizações em tempo real
    pollingInterval.current = setInterval(fetchRoom, 2000) // Atualizar a cada 2 segundos

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [fetchRoom])

  // Funções específicas do jogo
  const joinRoom = useCallback(async (playerName: string) => {
    return sendAction('join', { playerName })
  }, [sendAction])

  const startGame = useCallback(async () => {
    return sendAction('start-game')
  }, [sendAction])

  const submitDefinition = useCallback(async (definition: string) => {
    return sendAction('submit-definition', { 
      definition, 
      playerId 
    })
  }, [sendAction, playerId])

  const submitVote = useCallback(async (definitionId: string) => {
    return sendAction('submit-vote', { 
      vote: definitionId, 
      playerId 
    })
  }, [sendAction, playerId])

  const nextRound = useCallback(async () => {
    return sendAction('next-round')
  }, [sendAction])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    room,
    loading,
    error,
    playerId,
    isConnected: !loading && !error,
    joinRoom,
    startGame,
    submitDefinition,
    submitVote,
    nextRound,
    clearError,
    refreshRoom: fetchRoom
  }
}