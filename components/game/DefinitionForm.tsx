'use client'

import { useState } from 'react'

interface DefinitionFormProps {
  word: string
  onSubmit: (definition: string) => void
  disabled?: boolean
}

export default function DefinitionForm({ word, onSubmit, disabled = false }: DefinitionFormProps) {
  const [definition, setDefinition] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!definition.trim() || isSubmitting || disabled) return

    setIsSubmitting(true)
    try {
      await onSubmit(definition.trim())
      setDefinition('')
    } catch (error) {
      console.error('Erro ao enviar definição:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Crie uma definição falsa
        </h2>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Palavra:</p>
          <p className="text-2xl font-bold text-blue-600">{word}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="definition" className="block text-sm font-medium text-gray-700 mb-2">
            Sua definição falsa:
          </label>
          <textarea
            id="definition"
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder="Digite uma definição convincente mas falsa..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            disabled={disabled || isSubmitting}
            maxLength={200}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {definition.length}/200 caracteres
          </div>
        </div>

        <button
          type="submit"
          disabled={!definition.trim() || isSubmitting || disabled}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
            !definition.trim() || isSubmitting || disabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Definição'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
        <p className="text-xs text-yellow-800">
          💡 <strong>Dica:</strong> Crie uma definição que pareça real para enganar outros jogadores!
        </p>
      </div>
    </div>
  )
}