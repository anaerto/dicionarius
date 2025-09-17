import Link from 'next/link'

export default function Home() {
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
          
          <Link 
            href="/join/sala-teste"
            className="block bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            Entrar como Jogador (Mobile)
          </Link>
        </div>
      </div>
    </div>
  )
}