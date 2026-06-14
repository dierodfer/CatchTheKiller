// El tablero: renderiza la cuadrícula de celdas (con numeración de filas y
// columnas) a partir de la geometría calculada por useBoardGeometry.

import Cell from './Cell.jsx'
import { useBoardGeometry } from '@/hooks/useBoardGeometry.js'

const GUTTER = 18

export default function Board({
  puzzle,
  placements,
  selectedToken,
  onCellClick,
  onTokenClick,
  revealMode,
}) {
  const { map, roomLookup, characters, solution, killer } = puzzle
  const { size, cellSize, cellGeometry, controlled, revealRoom, occupantAt } = useBoardGeometry({
    map,
    roomLookup,
    placements,
    revealMode,
    killer,
    victim: characters.victim,
    solution,
  })

  const axisLabel = 'flex items-center justify-center text-[10px] font-semibold text-slate-500'

  // Cabecera: esquina vacía + número de cada columna.
  const header = (
    <div className="flex">
      <div style={{ width: GUTTER, height: GUTTER }} />
      {Array.from({ length: size }, (_, c) => (
        <div key={c} className={axisLabel} style={{ width: cellSize, height: GUTTER }}>
          {c + 1}
        </div>
      ))}
    </div>
  )

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
          revealCell={revealRoom.has(key)}
          selectedToken={selectedToken}
          onCellClick={onCellClick}
          onTokenClick={onTokenClick}
          revealMode={revealMode}
        />,
      )
    }
    rows.push(
      <div key={r} className="flex">
        {/* Número de fila. */}
        <div className={axisLabel} style={{ width: GUTTER, height: cellSize }}>
          {r + 1}
        </div>
        {cells}
      </div>,
    )
  }

  return (
    <div className="inline-block rounded-xl bg-ink-800/70 p-2 shadow-2xl ring-1 ring-white/5">
      {header}
      {rows}
    </div>
  )
}
