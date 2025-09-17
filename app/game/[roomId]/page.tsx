'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useGameRoom } from '@/lib/socket-client'
import { RoundResult } from '@/lib/types'
import QRCodeDisplay from '@/components/game/QRCodeDisplay'
import PlayersList from '@/components/game/PlayersList'
import DefinitionsList from '@/components/game/DefinitionsList'

export default function GameHostPage() {
  const params = useParams()
  const roomId = params.roomId as string
  const [joinUrl, setJoinUrl] = useState('')
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null)

  const {
    socket,
    isConnected,
    room,
    error,
    startGame,
    nextRound,
    clearError
  } = useGameRoom(roomId)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setJoinUrl(`${window.location.origin}/join/${roomId}`)
    }
  }, [roomId])

  useEffect(() => {
    if (!socket) return

    const handleRoundEnded = (result: RoundResult) => {
      setRoundResult(result)
    }

    const handleGameEnded = (finalScores: { [playerId: string]: number }) => {
      console.log('Jogo finalizado:', finalScores)
    }

    socket.on('round-ended', handleRoundEnded)
    socket.on('game-ended', handleGameEnded)

    return () => {
      socket.off('round-ended', handleRoundEnded)
      socket.off('game-ended', handleGameEnded)
    }
  }, [socket])

  const handleStartGame = () => {
    if (room && room.players.length >= 2) {
      startGame()
    }
  }

  const handleNextRound = () => {
    setRoundResult(null)
    nextRound()
  }

  const canStartGame = room && room.players.length >= 2 && room.state === 'waiting'

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando ao servidor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button 
            onClick={clearError}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Dicionarius</h1>
          <p className="text-gray-600">Sala: {roomId}</p>
          {room && room.state !== 'waiting' && (
            <p className="text-lg font-semibold text-blue-600">
              Rodada {room.currentRound}/{room.totalRounds}
            </p>
          )}
        </div>

        {/* Estado: Aguardando jogadores */}
        {room?.state === 'waiting' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                Aguardando Jogadores
              </h2>
              <QRCodeDisplay url={joinUrl} />
              <div className="mt-6">
                <button
                  onClick={handleStartGame}
                  disabled={!canStartGame}
                  className={`px-6 py-3 rounded-lg font-semibold ${
                    canStartGame
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Iniciar Partida
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Mínimo 2 jogadores necessários
                </p>
              </div>
            </div>
            
            <PlayersList players={room.players} gameState={room.state} />
          </div>
        )}

        {/* Estado: Criando definições */}
        {room?.state === 'defining' && (
          <div className="space-y-6">
            <div className="text-center bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-2xl font-semibold mb-2 text-gray-800">
                Fase de Definições
              </h2>
              {room.currentWord && (
                <div className="mb-4">
                  <p className="text-lg text-gray-600 mb-2">Palavra atual:</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {room.currentWord.word}
                  </p>
                </div>
              )}
              <p className="text-gray-600">
                Aguardando os jogadores criarem definições falsas...
              </p>
            </div>
            
            <PlayersList players={room.players} gameState={room.state} />
          </div>
        )}

        {/* Estado: Votação */}
        {room?.state === 'voting' && (
          <div className="space-y-6">
            <div className="text-center bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-2xl font-semibold mb-2 text-gray-800">
                Fase de Votação
              </h2>
              {room.currentWord && (
                <div className="mb-4">
                  <p className="text-lg text-gray-600 mb-2">Palavra:</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {room.currentWord.word}
                  </p>
                </div>
              )}
              <p className="text-gray-600">
                Jogadores estão votando na definição correta...
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <DefinitionsList definitions={room.definitions} showVotes={true} />
              <PlayersList players={room.players} gameState={room.state} />
            </div>
          </div>
        )}

        {/* Estado: Resultados */}
        {room?.state === 'results' && roundResult && (
          <div className="space-y-6">
            <div className="text-center bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-2xl font-semibold mb-2 text-gray-800">
                Resultado da Rodada {roundResult.round}
              </h2>
              <div className="mb-4">
                <p className="text-lg text-gray-600 mb-2">Palavra:</p>
                <p className="text-3xl font-bold text-blue-600">
                  {roundResult.word.word}
                </p>
                <p className="text-lg text-gray-600 mt-2">
                  Definição correta: <span className="font-semibold">{roundResult.word.definition}</span>
                </p>
              </div>
            </div>

            <DefinitionsList 
              definitions={roundResult.definitions} 
              showVotes={true} 
              showAuthors={true} 
            />

            {/* Pontuação da rodada */}
            <div className="bg-white rounded-lg p-4 shadow-md">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                Pontos desta rodada
              </h3>
              <div className="space-y-2">
                {Object.entries(roundResult.scores).map(([playerId, points]) => {
                  const player = room.players.find(p => p.id === playerId)
                  return (
                    <div key={playerId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{player?.name || 'Jogador'}</span>
                      <span className="text-blue-600 font-bold">+{points} pts</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Ranking atual */}
            <div className="bg-white rounded-lg p-4 shadow-md">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                Ranking Atual
              </h3>
              <div className="space-y-2">
                {[...room.players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div key={player.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-600">#{index + 1}</span>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <span className="text-blue-600 font-bold">{player.score} pts</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleNextRound}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold"
              >
                {room.currentRound >= room.totalRounds ? 'Ver Vencedor' : 'Próxima Rodada'}
              </button>
            </div>
          </div>
        )}

        {/* Estado: Jogo finalizado */}
        {room?.state === 'finished' && (
          <div className="text-center space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-3xl font-bold mb-4 text-gray-800">
                🏆 Jogo Finalizado!
              </h2>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Classificação Final</h3>
                {[...room.players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div 
                      key={player.id} 
                      className={`flex justify-between items-center p-4 rounded-lg ${
                        index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`text-2xl ${index === 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                        <span className={`font-bold text-lg ${index === 0 ? 'text-yellow-800' : 'text-gray-800'}`}>
                          {player.name}
                        </span>
                      </div>
                      <span className={`font-bold text-xl ${index === 0 ? 'text-yellow-600' : 'text-blue-600'}`}>
                        {player.score} pts
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold"
            >
              Nova Partida
            </button>
          </div>
        )}
      </div>
    </div>
  )
}