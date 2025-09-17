import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { GameRoom, SocketEvents } from './types'

export function useSocket() {
  const [socket, setSocket] = useState<Socket<SocketEvents> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = io({
      transports: ['websocket', 'polling']
    })

    socketInstance.on('connect', () => {
      console.log('Conectado ao servidor Socket.io')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('Desconectado do servidor Socket.io')
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return { socket, isConnected }
}

export function useGameRoom(roomId: string) {
  const { socket, isConnected } = useSocket()
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!socket) return

    const handleRoomUpdated = (updatedRoom: GameRoom) => {
      setRoom(updatedRoom)
    }

    const handleError = (message: string) => {
      setError(message)
    }

    socket.on('room-updated', handleRoomUpdated)
    socket.on('error', handleError)

    return () => {
      socket.off('room-updated', handleRoomUpdated)
      socket.off('error', handleError)
    }
  }, [socket])

  const joinRoom = (playerName: string) => {
    if (socket) {
      socket.emit('join-room', { roomId, playerName })
    }
  }

  const startGame = () => {
    if (socket) {
      socket.emit('start-game', roomId)
    }
  }

  const submitDefinition = (definition: string) => {
    if (socket) {
      socket.emit('submit-definition', { roomId, definition })
    }
  }

  const submitVote = (definitionId: string) => {
    if (socket) {
      socket.emit('submit-vote', { roomId, definitionId })
    }
  }

  const nextRound = () => {
    if (socket) {
      socket.emit('next-round', roomId)
    }
  }

  return {
    socket,
    isConnected,
    room,
    error,
    joinRoom,
    startGame,
    submitDefinition,
    submitVote,
    nextRound,
    clearError: () => setError(null)
  }
}