import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { GameRoom, Player, Definition, RoundResult, Word } from './types'

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('connecting')
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 10
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    console.log('Inicializando Socket.io client...')
    
    const socketInstance = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: maxReconnectAttempts,
      autoConnect: true,
    })

    socketInstance.on('connect', () => {
      console.log('Socket.io conectado:', socketInstance.id)
      setIsConnected(true)
      setConnectionStatus('connected')
      setError(null)
      reconnectAttempts.current = 0
      
      // Limpar timer de reconexão se existir
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket.io desconectado:', reason)
      setIsConnected(false)
      setConnectionStatus('disconnected')
      
      // Diferentes estratégias baseadas na razão da desconexão
      if (reason === 'io server disconnect') {
        // Servidor desconectou intencionalmente
        setError('Servidor desconectou. Tentando reconectar...')
        attemptReconnection(socketInstance)
      } else if (reason === 'transport close' || reason === 'transport error') {
        // Problema de rede
        setError('Problema de conexão. Tentando reconectar...')
        attemptReconnection(socketInstance)
      } else if (reason === 'ping timeout') {
        // Timeout de ping
        setError('Conexão perdida. Tentando reconectar...')
        attemptReconnection(socketInstance)
      }
    })

    socketInstance.on('connect_error', (err) => {
      console.error('Erro de conexão Socket.io:', err)
      setConnectionStatus('reconnecting')
      reconnectAttempts.current++
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        setError('Não foi possível conectar ao servidor após múltiplas tentativas. Verifique sua conexão.')
        setConnectionStatus('disconnected')
      } else {
        setError(`Tentando reconectar... (${reconnectAttempts.current}/${maxReconnectAttempts})`)
      }
    })

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('Socket.io reconectado após', attemptNumber, 'tentativas')
      setIsConnected(true)
      setConnectionStatus('connected')
      setError(null)
      reconnectAttempts.current = 0
    })

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log('Tentativa de reconexão:', attemptNumber)
      setConnectionStatus('reconnecting')
      setError(`Reconectando... (tentativa ${attemptNumber}/${maxReconnectAttempts})`)
    })

    socketInstance.on('reconnect_error', (err) => {
      console.error('Erro de reconexão:', err)
      setError('Erro ao tentar reconectar')
    })

    socketInstance.on('reconnect_failed', () => {
      console.error('Falha na reconexão após múltiplas tentativas')
      setError('Não foi possível reconectar ao servidor. Recarregue a página.')
      setConnectionStatus('disconnected')
    })

    // Detectar mudanças na conectividade da rede
    const handleOnline = () => {
      console.log('Rede online detectada')
      if (!socketInstance.connected) {
        setError('Rede restaurada. Tentando reconectar...')
        attemptReconnection(socketInstance)
      }
    }

    const handleOffline = () => {
      console.log('Rede offline detectada')
      setError('Sem conexão com a internet')
      setConnectionStatus('disconnected')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setSocket(socketInstance)

    return () => {
      console.log('Desconectando Socket.io...')
      
      // Limpar listeners de rede
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      // Limpar timer de reconexão
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
      }
      
      socketInstance.disconnect()
    }
  }, [])

  const attemptReconnection = (socketInstance: Socket) => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
    }

    reconnectTimer.current = setTimeout(() => {
      if (!socketInstance.connected && reconnectAttempts.current < maxReconnectAttempts) {
        console.log('Tentando reconexão manual...')
        setConnectionStatus('reconnecting')
        socketInstance.connect()
      }
    }, 2000)
  }

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    socket,
    isConnected,
    connectionStatus,
    error,
    clearError
  }
}

export function useGameSocket(roomId: string) {
  const { socket, isConnected, connectionStatus, error, clearError } = useSocket()
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Configurar listeners dos eventos do jogo
  useEffect(() => {
    if (!socket) return

    const handleRoomUpdated = (updatedRoom: GameRoom) => {
      console.log('Sala atualizada:', updatedRoom)
      setRoom(updatedRoom)
      setLoading(false)
    }

    const handlePlayerJoined = (player: Player) => {
      console.log('Jogador entrou:', player)
    }

    const handleGameStarted = () => {
      console.log('Jogo iniciado')
    }

    const handleRoundStarted = (word: Word) => {
      console.log('Rodada iniciada com palavra:', word)
    }

    const handleVotingStarted = (definitions: Definition[]) => {
      console.log('Votação iniciada com definições:', definitions)
    }

    const handleRoundEnded = (result: RoundResult) => {
      console.log('Rodada finalizada:', result)
    }

    const handleGameEnded = (finalScores: { [playerId: string]: number }) => {
      console.log('Jogo finalizado:', finalScores)
    }

    const handleError = (message: string) => {
      console.error('Erro do servidor:', message)
      setError(message)
    }

    // Registrar listeners
    socket.on('room-updated', handleRoomUpdated)
    socket.on('player-joined', handlePlayerJoined)
    socket.on('game-started', handleGameStarted)
    socket.on('round-started', handleRoundStarted)
    socket.on('voting-started', handleVotingStarted)
    socket.on('round-ended', handleRoundEnded)
    socket.on('game-ended', handleGameEnded)
    socket.on('error', handleError)

    return () => {
      // Remover listeners
      socket.off('room-updated', handleRoomUpdated)
      socket.off('player-joined', handlePlayerJoined)
      socket.off('game-started', handleGameStarted)
      socket.off('round-started', handleRoundStarted)
      socket.off('voting-started', handleVotingStarted)
      socket.off('round-ended', handleRoundEnded)
      socket.off('game-ended', handleGameEnded)
      socket.off('error', handleError)
    }
  }, [socket, setError])

  // Funções do jogo
  const joinRoom = useCallback(async (playerName: string) => {
    if (!socket || !isConnected) {
      throw new Error('Socket não conectado')
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao entrar na sala'))
      }, 10000)

      socket.emit('join-room', { roomId, playerName })
      
      // Aguardar confirmação via room-updated
      const handleRoomUpdate = (updatedRoom: GameRoom) => {
        const player = updatedRoom.players.find(p => p.name === playerName)
        if (player) {
          clearTimeout(timeout)
          setPlayerId(player.id)
          socket.off('room-updated', handleRoomUpdate)
          resolve({ room: updatedRoom, playerId: player.id })
        }
      }

      socket.on('room-updated', handleRoomUpdate)
    })
  }, [socket, isConnected, roomId])

  const startGame = useCallback(() => {
    if (!socket || !isConnected) {
      throw new Error('Socket não conectado')
    }
    socket.emit('start-game', roomId)
  }, [socket, isConnected, roomId])

  const submitDefinition = useCallback((definition: string) => {
    if (!socket || !isConnected) {
      throw new Error('Socket não conectado')
    }
    socket.emit('submit-definition', { roomId, definition })
  }, [socket, isConnected, roomId])

  const submitVote = useCallback((definitionId: string) => {
    if (!socket || !isConnected) {
      throw new Error('Socket não conectado')
    }
    socket.emit('submit-vote', { roomId, definitionId })
  }, [socket, isConnected, roomId])

  const nextRound = useCallback(() => {
    if (!socket || !isConnected) {
      throw new Error('Socket não conectado')
    }
    socket.emit('next-round', roomId)
  }, [socket, isConnected, roomId])

  return {
    room,
    playerId,
    loading,
    error,
    isConnected,
    connectionStatus,
    joinRoom,
    startGame,
    submitDefinition,
    submitVote,
    nextRound,
    clearError
  }
}