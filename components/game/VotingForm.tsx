'use client'

import { useState } from 'react'
import { Definition } from '@/lib/types'

interface VotingFormProps {
  word: string
  definitions: Definition[]
  playerDefinitionId?: string
  onSubmit: (definitionId: string) => void
  disabled?: boolean
}

export default function VotingForm({ 
  word, 
  definitions, 
  playerDefinitionId, 
  onSubmit, 
  disabled = false 
}: VotingFormProps) {
  const [selectedDefinition, setSelectedDefinition] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDefinition || isSubmitting || disabled) return

    setIsSubmitting(true)
    try {
      await onSubmit(selectedDefinition)
    } catch (error) {
      console.error('Erro ao enviar voto:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Vote na definição correta
        </h2>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Palavra:</p>
          <p className="text-2xl font-bold text-blue-600">{word}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          {definitions.map((definition, index) => {
            const isPlayerDefinition = definition.id === playerDefinitionId
            
            return (
              <label
                key={definition.id}
                className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedDefinition === definition.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                } ${
                  isPlayerDefinition
                    ? 'bg-green-50 border-green-300'
                    : ''
                } ${
                  disabled ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="definition"
                    value={definition.id}
                    checked={selectedDefinition === definition.id}
                    onChange={(e) => setSelectedDefinition(e.target.value)}
                    disabled={disabled || isSubmitting}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-gray-700">
                        {letters[index]}:
                      </span>
                      {isPlayerDefinition && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          SUA DEFINIÇÃO
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800">{definition.text}</p>
                  </div>
                </div>
              </label>
            )
          })}
        </div>

        <button
          type="submit"
          disabled={!selectedDefinition || isSubmitting || disabled}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
            !selectedDefinition || isSubmitting || disabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isSubmitting ? 'Enviando...' : 'Confirmar Voto'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>Dica:</strong> Você pode votar na sua própria definição, mas não ganhará pontos por isso!
        </p>
      </div>
    </div>
  )
}