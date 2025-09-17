import { Player } from '@/lib/types'

interface PlayersListProps {
  players: Player[]
  gameState: string
}

export default function PlayersList({ players, gameState }: PlayersListProps) {
  const getPlayerStatus = (player: Player) => {
    if (gameState === 'defining') {
      return player.hasSubmittedDefinition ? '✓' : '⏳'
    }
    if (gameState === 'voting') {
      return player.hasVoted ? '✓' : '⏳'
    }
    return ''
  }

  const getPlayerStatusText = (player: Player) => {
    if (gameState === 'defining') {
      return player.hasSubmittedDefinition ? 'Definição enviada' : 'Aguardando definição'
    }
    if (gameState === 'voting') {
      return player.hasVoted ? 'Voto enviado' : 'Aguardando voto'
    }
    return 'Conectado'
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Jogadores ({players.length})
      </h3>
      
      {players.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          Aguardando jogadores...
        </p>
      ) : (
        <div className="space-y-2">
          {players.map((player) => (
            <div 
              key={player.id} 
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center space-x-3">
                <span className="font-medium text-gray-800">{player.name}</span>
                <span className="text-sm text-gray-600">
                  {player.score} pts
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {getPlayerStatusText(player)}
                </span>
                <span className="text-lg">
                  {getPlayerStatus(player)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}