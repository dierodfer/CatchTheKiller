import { useEffect, useRef, useState } from 'react'
import { useGame, STATUS } from '@/state/useGame.js'
import { loadSavedGame, clearSavedGame } from '@/state/gameStorage.js'
import StartScreen from '@/components/StartScreen.jsx'
import GameScreen from '@/components/GameScreen.jsx'
import ResumeGameModal from '@/components/ResumeGameModal.jsx'
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt.jsx'

export default function App() {
  const game = useGame()
  const { state, selectDifficulty, setIrregular, generate, loadFromCode, resumeGame } = game
  // Un enlace compartido (#c=CODIGO) siempre gana sobre una partida guardada
  // (intención explícita y más reciente del jugador), así que si hay hash no
  // se ofrece continuar nada. Se calcula en el estado inicial (no en un
  // efecto) porque es una lectura síncrona de localStorage sin efectos
  // secundarios sobre otros sistemas.
  const [pendingResume, setPendingResume] = useState(() =>
    /^#c=/.test(window.location.hash) ? null : loadSavedGame(),
  )

  const onStart = (difficulty) => generate({ difficulty })

  // Enlace compartido (#c=CODIGO): carga el caso al arrancar y limpia el hash
  // para que recargar la página no vuelva a forzar la misma partida.
  const hashHandled = useRef(false)
  useEffect(() => {
    if (hashHandled.current) return
    hashHandled.current = true
    const match = /^#c=(.+)$/.exec(window.location.hash)
    if (!match) return
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    clearSavedGame()
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
      <ResumeGameModal
        open={!!pendingResume}
        onDiscard={() => {
          clearSavedGame()
          setPendingResume(null)
        }}
        onResume={() => {
          resumeGame(pendingResume)
          setPendingResume(null)
        }}
      />
      <PWAUpdatePrompt />
    </>
  )
}
