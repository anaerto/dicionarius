import { useEffect, useState, useCallback } from 'react'
import { GameRoom, Player } from './types'

export function useGameClient() {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simular conexão
    const timer = setTimeout(() => {
      setIsConnected(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const apiCall = useCallback(async (action: string, data: any = {}) => {
    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...data }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'API call failed')
      }

      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    }
  }, [])

  const getRoom = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`/api/game?roomId=${roomId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get room')
      }
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    }
  }, [])

  return {
    isConnected,
    error,
    apiCall,
    getRoom,
    clearError: () => setError(null)
  }
}

export function useGameRoom(roomId: string) {
  const { isConnected, apiCall, getRoom, error, clearError } = useGameClient()
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Polling para atualizações em tempo real
  useEffect(() => {
    if (!isConnected || !roomId) return

    const pollRoom = async () => {
      try {
        const roomData = await getRoom(roomId)
        setRoom(roomData)
        setLoading(false)
      } catch (err) {
        // Se a sala não existir, tentar criar
        if (err instanceof Error && err.message.includes('not found')) {
          try {
            const newRoom = await apiCall('create-room', { roomId })
            setRoom(newRoom)
            setLoading(false)
          } catch (createErr) {
            console.error('Failed to create room:', createErr)
            setLoading(false)
          }
        } else {
          console.error('Failed to poll room:', err)
          setLoading(false)
        }
      }
    }

    // Poll inicial
    pollRoom()

    // Poll a cada 2 segundos
    const interval = setInterval(pollRoom, 2000)

    return () => clearInterval(interval)
  }, [isConnected, roomId, apiCall, getRoom])

  const joinRoom = useCallback(async (playerName: string) => {
    try {
      const result = await apiCall('join-room', { roomId, playerName })
      setRoom(result.room)
      setPlayerId(result.playerId)
      return result
    } catch (err) {
      console.error('Failed to join room:', err)
      throw err
    }
  }, [apiCall, roomId])

  const startGame = useCallback(async () => {
    try {
      const result = await apiCall('start-game', { roomId })
      setRoom(result)
      return result
    } catch (err) {
      console.error('Failed to start game:', err)
      throw err
    }
  }, [apiCall, roomId])

  const submitDefinition = useCallback(async (definition: string) => {
    if (!playerId) throw new Error('Player ID not set')
    
    try {
      const result = await apiCall('submit-definition', { 
        roomId, 
        playerId, 
        definition 
      })
      setRoom(result)
      return result
    } catch (err) {
      console.error('Failed to submit definition:', err)
      throw err
    }
  }, [apiCall, roomId, playerId])

  const submitVote = useCallback(async (vote: string) => {
    if (!playerId) throw new Error('Player ID not set')
    
    try {
      const result = await apiCall('submit-vote', { 
        roomId, 
        playerId, 
        vote 
      })
      setRoom(result)
      return result
    } catch (err) {
      console.error('Failed to submit vote:', err)
      throw err
    }
  }, [apiCall, roomId, playerId])

  const nextRound = useCallback(async () => {
    try {
      const result = await apiCall('next-round', { roomId })
      setRoom(result)
      return result
    } catch (err) {
      console.error('Failed to go to next round:', err)
      throw err
    }
  }, [apiCall, roomId])

  return {
    room,
    playerId,
    loading,
    error,
    isConnected,
    joinRoom,
    startGame,
    submitDefinition,
    submitVote,
    nextRound,
    clearError
  }
}