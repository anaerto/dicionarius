# Dicionarius

Jogo multiplayer de adivinhação onde jogadores criam definições falsas para palavras obscuras.

## 🎮 Como Jogar

1. **Host (PC)**: Acesse `/game/sala-teste` para iniciar uma sala
2. **Jogadores (Mobile)**: Escaneiem o QR Code ou acessem `/join/sala-teste`
3. **Dinâmica**:
   - Jogadores criam definições falsas para palavras obscuras
   - Todos votam na definição que acham correta
   - Pontos: 1 ponto por acertar + 2 pontos por cada voto na sua definição falsa
   - 3 rodadas por partida

## 🚀 Setup Local

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
```

Acesse:
- Host: http://localhost:3000/game/sala-teste
- Jogadores: http://localhost:3000/join/sala-teste

## 📱 Deploy na Vercel

### Deploy Automático

1. Conecte seu repositório GitHub à Vercel
2. A Vercel detectará automaticamente o Next.js
3. Configure as variáveis de ambiente se necessário
4. Deploy será feito automaticamente

### Deploy Manual

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy para produção
vercel --prod
```

### Configurações Importantes

O arquivo `vercel.json` já está configurado para:
- Suporte ao Socket.io
- Funções serverless otimizadas
- Redirecionamentos necessários

## 🏗️ Arquitetura

### Stack Tecnológica
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Real-time**: Socket.io
- **Estado**: Em memória (sem banco de dados)
- **Deploy**: Vercel

### Estrutura de Pastas

```
/app
  /api/socket          # API Socket.io
  /game/[roomId]       # Tela do host
  /join/[roomId]       # Tela dos jogadores
/components/game       # Componentes do jogo
/lib
  /socket-client.ts    # Cliente Socket.io
  /socket-server.ts    # Servidor Socket.io
  /game-logic.ts       # Lógica do jogo
  /types.ts           # Tipos TypeScript
/data
  /words.json         # Palavras do jogo
```

## 🎯 Funcionalidades

### ✅ Implementado
- [x] Sala única com ID fixo
- [x] Sistema de jogadores (2-4)
- [x] Estados do jogo (waiting, defining, voting, results, finished)
- [x] Criação de definições falsas
- [x] Sistema de votação
- [x] Cálculo de pontuação
- [x] Interface responsiva (PC + Mobile)
- [x] QR Code para entrada
- [x] PWA (Progressive Web App)
- [x] Socket.io real-time
- [x] Deploy na Vercel

### Estados do Jogo

1. **Waiting**: Aguardando jogadores (mín. 2)
2. **Defining**: Jogadores criam definições falsas
3. **Voting**: Jogadores votam na definição correta
4. **Results**: Mostra resultado da rodada
5. **Finished**: Fim da partida com ranking final

### Pontuação

- **1 ponto**: Acertar a definição correta
- **2 pontos**: Cada voto recebido na sua definição falsa
- Pode votar na própria definição (sem ganhar ponto)

## 🔧 Desenvolvimento

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção local
npm run start

# Lint
npm run lint
```

### Estrutura de Dados

```typescript
interface GameRoom {
  id: string
  state: 'waiting' | 'defining' | 'voting' | 'results' | 'finished'
  players: Player[]
  currentRound: number
  totalRounds: number
  currentWord?: Word
  definitions: Definition[]
}
```

## 🌐 URLs

### Produção
- Host: `https://seu-app.vercel.app/game/sala-teste`
- Jogadores: `https://seu-app.vercel.app/join/sala-teste`

### Local
- Host: `http://localhost:3000/game/sala-teste`
- Jogadores: `http://localhost:3000/join/sala-teste`

## 📝 Notas Técnicas

- **Socket.io**: Configurado para funcionar com Vercel serverless
- **Estado**: Mantido em memória (resetado a cada deploy)
- **PWA**: Instalável em dispositivos móveis
- **Responsivo**: Mobile-first design
- **TypeScript**: Tipagem completa
- **Error Handling**: Tratamento básico de erros

## 🐛 Troubleshooting

### Socket.io não conecta
- Verifique se a API route está funcionando: `/api/socket`
- Confirme configurações do `vercel.json`

### QR Code não aparece
- Verifique se a biblioteca `qrcode` está instalada
- Confirme se a URL está sendo gerada corretamente

### Jogadores não conseguem entrar
- Verifique se o nome não está duplicado
- Confirme se o jogo não está em andamento

## 📄 Licença

MIT License - Livre para uso e modificação.