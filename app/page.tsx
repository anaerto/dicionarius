'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  const handleJoinClick = () => {
    // Força uma navegação limpa para evitar problemas de RSC
    window.location.href = '/join/sala-teste'
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Dicionarius</h1>
        <p className="text-lg text-gray-600 mb-8">Jogo de adivinhação multiplayer</p>
        
        <div className="space-y-4">
          <Link 
            href="/game/sala-teste"
            className="block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Iniciar como Host (PC)
          </Link>
          
          <button
            onClick={handleJoinClick}
            className="block w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            Entrar como Jogador (Mobile)
          </button>

          <div className="mt-8 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Problemas de carregamento?</p>
            <button
              onClick={handleRefresh}
              className="text-blue-500 hover:text-blue-600 text-sm underline"
            >
              Atualizar Página
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}