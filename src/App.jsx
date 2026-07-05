import { useEffect, useRef } from 'react'
import { useGame, STATUS } from '@/state/useGame.js'
import StartScreen from '@/components/StartScreen.jsx'
import GameScreen from '@/components/GameScreen.jsx'
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt.jsx'

export default function App() {
  const game = useGame()
  const { state, selectDifficulty, setIrregular, generate, loadFromCode } = game

  const onStart = (difficulty) => generate({ difficulty })

  // Enlace compartido (#c=CODIGO): carga el caso al arrancar y limpia el hash
  // para que recargar la página no vuelva a forzar la misma partida.
  const hashHandled = useRef(false)
  useEffect(() => {
    if (hashHandled.current) return
    hashHandled.current = true
    const match = window.location.hash.match(/^#c=(.+)$/)
    if (!match) return
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    loadFromCode(decodeURIComponent(match[1]))
  }, [loadFromCode])

  if (state.status === STATUS.PLAYING || state.status === STATUS.WIN || state.status === STATUS.FAIL) {
    return (
      <>
        <GameScreen game={game} />
        <PWAUpdatePrompt />
      </>
    )
  }

  return (
    <>
      <StartScreen
        difficulty={state.difficulty}
        onSelect={selectDifficulty}
        onStart={onStart}
        generating={state.status === STATUS.GENERATING}
        error={state.status === STATUS.ERROR ? state.error : null}
        irregular={state.irregular}
        onToggleIrregular={setIrregular}
        onLoadCode={loadFromCode}
      />
      <PWAUpdatePrompt />
    </>
  )
}
