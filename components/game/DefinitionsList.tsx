import { Definition } from '@/lib/types'

interface DefinitionsListProps {
  definitions: Definition[]
  showVotes?: boolean
  showAuthors?: boolean
}

export default function DefinitionsList({ 
  definitions, 
  showVotes = false, 
  showAuthors = false 
}: DefinitionsListProps) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Definições
      </h3>
      
      <div className="space-y-3">
        {definitions.map((definition, index) => (
          <div 
            key={definition.id}
            className={`p-3 rounded border-l-4 ${
              definition.isCorrect 
                ? 'border-green-500 bg-green-50' 
                : 'border-blue-500 bg-blue-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-bold text-gray-700">
                    {letters[index]}:
                  </span>
                  {definition.isCorrect && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      CORRETA
                    </span>
                  )}
                </div>
                
                <p className="text-gray-800">{definition.text}</p>
                
                {showAuthors && definition.authorId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Criada por: Jogador {definition.authorId.slice(-4)}
                  </p>
                )}
              </div>
              
              {showVotes && (
                <div className="ml-4 text-center">
                  <div className="text-lg font-bold text-gray-700">
                    {definition.votes.length}
                  </div>
                  <div className="text-xs text-gray-500">
                    {definition.votes.length === 1 ? 'voto' : 'votos'}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}