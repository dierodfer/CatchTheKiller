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
import { Skull } from 'lucide-react'
import Board from './Board.jsx'
import CharacterTray from './CharacterTray.jsx'
import CluePanel from './CluePanel.jsx'
import Toolbar from './Toolbar.jsx'
import ResultBanner from './ResultBanner.jsx'
import RevealConfirmModal from './RevealConfirmModal.jsx'
import { TokenChip } from './CharacterToken.jsx'
import { zoneForSeed } from './zones.js'
import { DIFFICULTIES } from '@/game/constants.js'

export default function GameScreen({ game }) {
  const { state, place, unplace, toggleClue, check, reveal, backToPlay, newGame } = game
  const { puzzle, placements, usedClues, status, result } = state
  const [selectedToken, setSelectedToken] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [confirmReveal, setConfirmReveal] = useState(false)
  // Resultado cuyo aviso se cerró. Cada desenlace nuevo genera un `result`
  // distinto, así que el aviso vuelve a mostrarse sin necesidad de efectos.
  const [dismissedResult, setDismissedResult] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const revealMode = status === 'win'
  const diff = DIFFICULTIES[puzzle.difficulty]
  const zone = useMemo(() => zoneForSeed(puzzle.seed), [puzzle.seed])
  const showBanner = (status === 'win' || status === 'fail') && result && dismissedResult !== result
  // Celebración solo cuando se resuelve de verdad (no al revelar la solución).
  const celebrating = status === 'win' && result?.solved && !result?.revealed
  const bannerDelay = celebrating ? Math.min(puzzle.map.rooms.length * 0.32 + 0.4, 2.2) : 0

  const allPlaced = useMemo(
    () =>
      [...puzzle.characters.suspects, puzzle.characters.victim].every((n) => placements[n]),
    [puzzle.characters, placements],
  )

  const handleTokenClick = useCallback(
    (name) => {
      if (revealMode) return
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

  const handleDragStart = (e) => {
    setActiveId(e.active.id)
    setSelectedToken(null)
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
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
      {/* Cabecera del caso. */}
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-9 w-auto drop-shadow" />
          <div>
            <h1 className="font-serif text-2xl font-semibold leading-none text-plum-900">
              Catch the Killer
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-gold/15 bg-cream-100/70 px-2 py-0.5 text-[11px] font-medium text-plum-800">
                {diff.label} · {puzzle.map.gridSize}×{puzzle.map.gridSize}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full bg-cream-100/70 px-2 py-0.5 text-[11px] font-medium text-plum-800"
                style={{ boxShadow: `inset 0 0 0 1px ${zone.accentSoft}` }}
              >
                <zone.icon size={11} style={{ color: zone.accent }} />
                {zone.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-gold/15 bg-cream-100/80 px-3 py-1.5 text-sm text-plum-800">
          <Skull size={15} className="text-plum-600" />
          Víctima: <span className="font-semibold text-plum-900">{puzzle.characters.victim}</span>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          {/* Personajes + tablero. */}
          <div className="flex justify-center lg:justify-start">
            <div className="flex max-w-full flex-col gap-3 overflow-x-auto">
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
              />
            </div>
          </div>

          {/* Panel lateral. */}
          <div className="flex w-full flex-col gap-4 lg:max-w-sm">
            <CluePanel puzzle={puzzle} usedClues={usedClues} onToggleClue={toggleClue} />
            <Toolbar
              allPlaced={allPlaced}
              onCheck={check}
              onReveal={() => setConfirmReveal(true)}
              onNewGame={newGame}
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
