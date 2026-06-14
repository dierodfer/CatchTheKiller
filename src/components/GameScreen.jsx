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
import { Skull, Map as MapIcon } from 'lucide-react'
import Board from './Board.jsx'
import CharacterTray from './CharacterTray.jsx'
import CluePanel from './CluePanel.jsx'
import Toolbar from './Toolbar.jsx'
import ResultBanner from './ResultBanner.jsx'
import { TokenChip } from './CharacterToken.jsx'
import { DIFFICULTIES } from '@/game/constants.js'

export default function GameScreen({ game }) {
  const { state, place, unplace, toggleClue, check, requestHint, dismissHint, backToPlay, newGame } =
    game
  const { puzzle, placements, usedClues, status, result, hint } = state
  const [selectedToken, setSelectedToken] = useState(null)
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const revealMode = status === 'win'
  const diff = DIFFICULTIES[puzzle.difficulty]

  const allPlaced = useMemo(
    () =>
      [...puzzle.characters.suspects, puzzle.characters.victim].every((n) => placements[n]),
    [puzzle.characters, placements],
  )

  const handleTokenClick = useCallback(
    (name) => {
      if (revealMode) return
      dismissHint()
      if (placements[name]) {
        unplace(name)
        setSelectedToken(null)
      } else {
        setSelectedToken((cur) => (cur === name ? null : name))
      }
    },
    [revealMode, placements, dismissHint, unplace],
  )

  const handleCellClick = useCallback(
    (r, c) => {
      if (revealMode || !selectedToken) return
      place(selectedToken, r, c)
      setSelectedToken(null)
      dismissHint()
    },
    [revealMode, selectedToken, place, dismissHint],
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
      dismissHint()
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      {/* Cabecera del caso. */}
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skull className="text-blood" size={22} />
          <h1 className="text-xl font-bold text-white">Catch the Killer</h1>
          <span className="rounded-full bg-ink-700 px-2 py-0.5 text-xs font-medium text-slate-300">
            {diff.label} · {puzzle.map.gridSize}×{puzzle.map.gridSize}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <MapIcon size={15} />
          Víctima: <span className="font-semibold text-slate-200">{puzzle.characters.victim}</span>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          {/* Personajes + tablero. */}
          <div className="flex justify-center lg:justify-start">
            <div className="flex flex-col gap-3">
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
                hint={hint}
              />
            </div>
          </div>

          {/* Panel lateral. */}
          <div className="flex w-full flex-col gap-4 lg:max-w-sm">
            <CluePanel puzzle={puzzle} usedClues={usedClues} onToggleClue={toggleClue} />
            <Toolbar
              allPlaced={allPlaced}
              hintsUsed={state.hintsUsed}
              hint={hint}
              onCheck={check}
              onHint={requestHint}
              onDismissHint={dismissHint}
              onNewGame={newGame}
            />
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeId ? <TokenChip name={activeId} characters={puzzle.characters} size={44} /> : null}
        </DragOverlay>
      </DndContext>

      <ResultBanner
        status={status}
        result={result}
        characters={puzzle.characters}
        onBackToPlay={backToPlay}
        onNewGame={newGame}
      />
    </div>
  )
}
