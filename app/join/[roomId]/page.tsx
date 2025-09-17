'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useGameRoom } from '@/lib/socket-client'
import { RoundResult } from '@/lib/types'
import DefinitionForm from '@/components/game/DefinitionForm'
import VotingForm from '@/components/game/VotingForm'

export default function JoinGamePage() {
  const params = useParams()
  const roomId = params.roomId as string
  const [playerName, setPlayerName] = useState('')
  const [hasJoined, setHasJoined] = useState(false)
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null)

  const {
    socket,
    isConnected,
    room,
    error,
    joinRoom,
    submitDefinition,
    submitVote,
    clearError
  } = useGameRoom(roomId)

  useEffect(() => {
    if (!socket) return

    const handleRoundEnded = (result: RoundResult) => {
      setRoundResult(result)
    }

    const handleGameEnded = (finalScores: { [playerId: string]: number }) => {
      console.log('Jogo finalizado:', finalScores)
    }

    const handleRoundStarted = () => {
      setRoundResult(null)
    }

    socket.on('round-ended', handleRoundEnded)
    socket.on('game-ended', handleGameEnded)
    socket.on('round-started', handleRoundStarted)

    return () => {
      socket.off('round-ended', handleRoundEnded)
      socket.off('game-ended', handleGameEnded)
      socket.off('round-started', handleRoundStarted)
    }
  }, [socket])

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (playerName.trim()) {
      joinRoom(playerName.trim())
      setHasJoined(true)
    }
  }

  const getCurrentPlayer = () => {
    return room?.players.find(p => p.id === socket?.id)
  }

  const getPlayerDefinitionId = () => {
    const currentPlayer = getCurrentPlayer()
    return currentPlayer?.id
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando ao servidor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button 
            onClick={() => {
              clearError()
              setHasJoined(false)
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  // Formulário de entrada
  if (!hasJoined || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Dicionarius</h1>
              <p className="text-gray-600">Sala: {roomId}</p>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Seu nome:
                </label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Digite seu nome"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={20}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!playerName.trim()}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  !playerName.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Entrar na Sala
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const currentPlayer = getCurrentPlayer()

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Dicionarius</h1>
          <p className="text-sm text-gray-600">Olá, {currentPlayer?.name}!</p>
          {room.state !== 'waiting' && (
            <p className="text-lg font-semibold text-blue-600">
              Rodada {room.currentRound}/{room.totalRounds}
            </p>
          )}
          {currentPlayer && (
            <p className="text-sm text-gray-600">
              Pontuação: <span className="font-bold text-blue-600">{currentPlayer.score} pts</span>
            </p>
          )}
        </div>

        {/* Estado: Aguardando início */}
        {room.state === 'waiting' && (
          <div className="bg-white rounded-lg p-6 shadow-md text-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Aguardando início do jogo
            </h2>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Jogadores conectados:</p>
              <div className="space-y-2">
                {room.players.map((player) => (
                  <div key={player.id} className="flex items-center justify-center space-x-2">
                    <span className={`font-medium ${player.id === socket?.id ? 'text-blue-600' : 'text-gray-800'}`}>
                      {player.name}
                    </span>
                    {player.id === socket?.id && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        VOCÊ
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Aguardando o host iniciar a partida...
            </p>
          </div>
        )}

        {/* Estado: Criando definição */}
        {room.state === 'defining' && room.currentWord && (
          <>
            {currentPlayer?.hasSubmittedDefinition ? (
              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Definição enviada!
                </h2>
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <p className="text-green-800">✓ Sua definição foi enviada com sucesso</p>
                </div>
                <p className="text-gray-600">
                  Aguardando outros jogadores terminarem...
                </p>
              </div>
            ) : (
              <DefinitionForm
                word={room.currentWord.word}
                onSubmit={submitDefinition}
              />
            )}
          </>
        )}

        {/* Estado: Votação */}
        {room.state === 'voting' && room.currentWord && (
          <>
            {currentPlayer?.hasVoted ? (
              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Voto enviado!
                </h2>
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <p className="text-green-800">✓ Seu voto foi registrado</p>
                </div>
                <p className="text-gray-600">
                  Aguardando outros jogadores votarem...
                </p>
              </div>
            ) : (
              <VotingForm
                word={room.currentWord.word}
                definitions={room.definitions}
                playerDefinitionId={getPlayerDefinitionId()}
                onSubmit={submitVote}
              />
            )}
          </>
        )}

        {/* Estado: Resultados */}
        {room.state === 'results' && roundResult && currentPlayer && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Resultado da Rodada {roundResult.round}
              </h2>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-1">Palavra:</p>
                <p className="text-2xl font-bold text-blue-600 mb-2">
                  {roundResult.word.word}
                </p>
                <p className="text-sm text-gray-600">
                  Definição correta: <span className="font-semibold">{roundResult.word.definition}</span>
                </p>
              </div>

              {/* Pontos ganhos */}
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <p className="text-green-800 font-semibold">
                  Você ganhou {roundResult.scores[currentPlayer.id] || 0} pontos nesta rodada!
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Total: {currentPlayer.score} pontos
                </p>
              </div>

              {/* Sua posição atual */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 font-medium mb-2">Ranking atual:</p>
                <div className="space-y-1">
                  {[...room.players]
                    .sort((a, b) => b.score - a.score)
                    .map((player, index) => (
                      <div 
                        key={player.id} 
                        className={`flex justify-between items-center text-sm ${
                          player.id === currentPlayer.id ? 'font-bold text-blue-600' : 'text-gray-600'
                        }`}
                      >
                        <span>#{index + 1} {player.name}</span>
                        <span>{player.score} pts</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600">
                Aguardando próxima rodada...
              </p>
            </div>
          </div>
        )}

        {/* Estado: Jogo finalizado */}
        {room.state === 'finished' && currentPlayer && (
          <div className="bg-white rounded-lg p-6 shadow-md text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              🏆 Jogo Finalizado!
            </h2>
            
            {/* Posição final do jogador */}
            <div className="mb-6">
              {(() => {
                const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)
                const playerPosition = sortedPlayers.findIndex(p => p.id === currentPlayer.id) + 1
                const isWinner = playerPosition === 1
                
                return (
                  <div className={`p-4 rounded-lg ${isWinner ? 'bg-yellow-100' : 'bg-blue-50'}`}>
                    <p className={`text-lg font-bold ${isWinner ? 'text-yellow-800' : 'text-blue-800'}`}>
                      {isWinner ? '🥇 Parabéns! Você venceu!' : `Você ficou em ${playerPosition}º lugar`}
                    </p>
                    <p className={`text-sm ${isWinner ? 'text-yellow-600' : 'text-blue-600'}`}>
                      Pontuação final: {currentPlayer.score} pontos
                    </p>
                  </div>
                )
              })()}
            </div>

            {/* Classificação final */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Classificação Final</h3>
              <div className="space-y-2">
                {[...room.players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div 
                      key={player.id} 
                      className={`flex justify-between items-center p-2 rounded ${
                        player.id === currentPlayer.id ? 'bg-blue-100' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-600">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                        <span className={`${player.id === currentPlayer.id ? 'font-bold' : ''}`}>
                          {player.name}
                        </span>
                      </div>
                      <span className="font-bold text-blue-600">
                        {player.score} pts
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => window.location.href = '/'}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}