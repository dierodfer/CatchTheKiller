// Pantalla de juego (estado PLAYING/WIN/FAIL): tablero + paneles + drag & drop.

import { useCallback, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { HelpCircle } from 'lucide-react'
import Board from './Board.jsx'
import CharacterTray from './CharacterTray.jsx'
import CluePanel from './CluePanel.jsx'
import Toolbar from './Toolbar.jsx'
import ResultBanner from './ResultBanner.jsx'
import RevealConfirmModal from './RevealConfirmModal.jsx'
import RulesModal from './RulesModal.jsx'
import LegendModal from './LegendModal.jsx'
import ShareModal from './ShareModal.jsx'
import { TokenChip } from './CharacterToken.jsx'
import { themeForSeed } from './zones.js'
import { DIFFICULTIES } from '@/game/constants.js'

export default function GameScreen({ game }) {
  const {
    state,
    place,
    unplace,
    toggleMark,
    toggleStruckClue,
    check,
    reveal,
    requestExtraClue,
    backToPlay,
    newGame,
  } = game
  const { puzzle, placements, marks, struckClues, status, result, revealedExtraIds } = state
  const [selectedToken, setSelectedToken] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [confirmReveal, setConfirmReveal] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [dismissedResult, setDismissedResult] = useState(null)
  // Qué casilla tiene abierto el popup de marcado: estado efímero de UI, al
  // contrario que `marks`, que forma parte de la partida y se persiste.
  const [markingCell, setMarkingCell] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const revealMode = status === 'win'
  const diff = DIFFICULTIES[puzzle.difficulty]
  const zone = useMemo(() => themeForSeed(puzzle.seed), [puzzle.seed])
  const showBanner = (status === 'win' || status === 'fail') && result && dismissedResult !== result
  // Celebración solo cuando se resuelve de verdad (no al revelar la solución).
  const celebrating = status === 'win' && result?.solved && !result?.revealed
  const bannerDelay = celebrating ? Math.min(puzzle.map.rooms.length * 0.32 + 0.4, 2.2) : 0

  const characterNames = useMemo(
    () => [...puzzle.characters.suspects, puzzle.characters.victim],
    [puzzle.characters],
  )
  const placedCount = useMemo(
    () => characterNames.filter((n) => placements[n]).length,
    [characterNames, placements],
  )
  const allPlaced = placedCount === characterNames.length

  const handleTokenClick = useCallback(
    (name) => {
      if (revealMode) return
      setMarkingCell(null)
      if (placements[name]) {
        unplace(name)
        setSelectedToken(null)
      } else {
        setSelectedToken((cur) => (cur === name ? null : name))
      }
    },
    [revealMode, placements, unplace],
  )

  const handleCellClick = useCallback(
    (r, c) => {
      if (revealMode || !selectedToken) return
      place(selectedToken, r, c)
      setSelectedToken(null)
    },
    [revealMode, selectedToken, place],
  )

  const handleMarkOpen = useCallback((r, c) => {
    setMarkingCell({ r, c })
  }, [])

  const handleMarkClose = useCallback(() => {
    setMarkingCell(null)
  }, [])

  const handleDragStart = (e) => {
    setActiveId(e.active.id)
    setSelectedToken(null)
    setMarkingCell(null)
  }

  const handleDragEnd = (e) => {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    if (over.id === 'tray') {
      unplace(active.id)
      return
    }
    if (typeof over.id === 'string' && over.id.startsWith('cell-')) {
      const [, r, c] = over.id.split('-')
      place(active.id, Number(r), Number(c))
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      <header className="mb-6 flex flex-col items-center gap-2.5 text-center">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="h-10 w-auto drop-shadow" />
          <h1 className="font-serif text-2xl font-semibold leading-none text-plum-900 sm:text-3xl">
            Catch the Killer
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="rounded-full border border-gold/15 bg-cream-100/70 px-2 py-0.5 text-[11px] font-medium text-plum-800">
            {diff.label} · {puzzle.map.gridSize}×{puzzle.map.gridSize}
          </span>
          {/* La chapa de ambientación abre la leyenda: es el sitio donde el
              jugador ya mira para saber en qué escenario está, y la leyenda es
              justo el resto de esa respuesta (cómo se llama y qué hace cada
              cosa en ESTA ambientación). Duplica el botón de la Toolbar a
              propósito — allí se busca ayuda, aquí se está mirando el tablero. */}
          <button
            type="button"
            onClick={() => setShowLegend(true)}
            aria-label={`Ambientación ${zone.label}. Ver la leyenda de elementos del tablero`}
            className="inline-flex items-center gap-1 rounded-full bg-cream-100/70 px-2 py-0.5 text-[11px] font-medium text-plum-800 transition hover:bg-cream-200/80 hover:text-plum-900"
            style={{ boxShadow: `inset 0 0 0 1px ${zone.accentSoft}` }}
          >
            <zone.icon size={11} style={{ color: zone.accent }} />
            {zone.label}
            <HelpCircle size={11} className="text-gold-deep" aria-hidden="true" />
          </button>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
          <div className="flex w-full justify-center lg:w-auto">
            <div className="flex max-w-full flex-col items-center gap-3 overflow-x-auto">
              <CharacterTray
                characters={puzzle.characters}
                placements={placements}
                selectedToken={selectedToken}
                onTokenClick={handleTokenClick}
              />
              <Board
                puzzle={puzzle}
                placements={placements}
                selectedToken={selectedToken}
                onCellClick={handleCellClick}
                onTokenClick={handleTokenClick}
                revealMode={revealMode}
                zone={zone}
                celebrating={celebrating}
                draggingName={activeId}
                marks={marks}
                markingCell={markingCell}
                onMarkToggle={toggleMark}
                onMarkOpen={handleMarkOpen}
                onMarkClose={handleMarkClose}
              />
            </div>
          </div>

          <div className="flex w-full flex-col gap-4 lg:max-w-sm">
            <CluePanel
              puzzle={puzzle}
              revealedExtraIds={revealedExtraIds}
              onRequestExtra={requestExtraClue}
              struckClues={struckClues}
              onToggleStruck={toggleStruckClue}
            />
            <Toolbar
              allPlaced={allPlaced}
              placedCount={placedCount}
              totalCount={characterNames.length}
              onCheck={check}
              onReveal={() => setConfirmReveal(true)}
              onNewGame={newGame}
              onShowRules={() => setShowRules(true)}
              onShowLegend={() => setShowLegend(true)}
              onShare={() => setShowShare(true)}
            />
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeId ? <TokenChip name={activeId} characters={puzzle.characters} size={44} /> : null}
        </DragOverlay>
      </DndContext>

      {showBanner && (
        <ResultBanner
          status={status}
          result={result}
          characters={puzzle.characters}
          bannerDelay={bannerDelay}
          onClose={() => setDismissedResult(result)}
          onBackToPlay={backToPlay}
          onNewGame={newGame}
        />
      )}

      <RulesModal open={showRules} onClose={() => setShowRules(false)} />

      <LegendModal open={showLegend} onClose={() => setShowLegend(false)} zone={zone} />

      <ShareModal
        open={showShare}
        onClose={() => setShowShare(false)}
        puzzle={puzzle}
        placements={placements}
      />

      <RevealConfirmModal
        open={confirmReveal}
        onCancel={() => setConfirmReveal(false)}
        onConfirm={() => {
          setConfirmReveal(false)
          reveal()
        }}
      />
    </div>
  )
}
