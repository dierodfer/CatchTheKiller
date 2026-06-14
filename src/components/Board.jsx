// El tablero: renderiza la cuadrícula de celdas a partir de la geometría
// calculada por useBoardGeometry.

import Cell from './Cell.jsx'
import { useBoardGeometry } from '@/hooks/useBoardGeometry.js'

export default function Board({
  puzzle,
  placements,
  selectedToken,
  onCellClick,
  onTokenClick,
  revealMode,
  hint,
}) {
  const { map, roomLookup, characters, solution, killer } = puzzle
  const { size, cellGeometry, controlled, killerLine, occupantAt } = useBoardGeometry({
    map,
    roomLookup,
    placements,
    revealMode,
    killer,
    solution,
  })

  const rows = []
  for (let r = 0; r < size; r++) {
    const cells = []
    for (let c = 0; c < size; c++) {
      const key = `${r},${c}`
      cells.push(
        <Cell
          key={key}
          geometry={cellGeometry[r][c]}
          characters={characters}
          occupantName={occupantAt[key]}
          controlled={controlled.has(key)}
          killerLine={killerLine.has(key)}
          hintTarget={hint && hint.row === r && hint.col === c}
          selectedToken={selectedToken}
          onCellClick={onCellClick}
          onTokenClick={onTokenClick}
          revealMode={revealMode}
        />,
      )
    }
    rows.push(
      <div key={r} className="flex">
        {cells}
      </div>,
    )
  }

  return (
    <div className="inline-block rounded-xl bg-ink-800/70 p-2 shadow-2xl ring-1 ring-white/5">
      {rows}
    </div>
  )
}
