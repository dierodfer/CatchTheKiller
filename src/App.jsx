// Raíz de la aplicación: enruta entre pantalla de inicio y de juego según estado.

import { useGame, STATUS } from './state/useGame.js'
import StartScreen from './components/StartScreen.jsx'
import GameScreen from './components/GameScreen.jsx'

export default function App() {
  const game = useGame()
  const { state, selectDifficulty, generate } = game

  const onStart = (difficulty) => generate(difficulty)

  if (state.status === STATUS.PLAYING || state.status === STATUS.WIN || state.status === STATUS.FAIL) {
    return <GameScreen game={game} />
  }

  return (
    <StartScreen
      difficulty={state.difficulty}
      onSelect={selectDifficulty}
      onStart={onStart}
      generating={state.status === STATUS.GENERATING}
      error={state.status === STATUS.ERROR ? state.error : null}
    />
  )
}
