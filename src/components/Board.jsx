// El tablero: calcula la geometría (habitaciones, bordes, líneas de control) y
// renderiza la cuadrícula de celdas.

import { useMemo } from 'react'
import Cell from './Cell.jsx'
import { ROOM_TINTS } from './palette.js'
import { controlLineCells } from '../game/killerRule.js'

const CELL_SIZE = { 4: 80, 5: 68, 6: 58 }
const BORDER_ROOM = '2px solid rgba(148,163,184,0.55)'
const BORDER_THIN = '1px solid rgba(148,163,184,0.12)'

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
  const size = map.gridSize
  const cellSize = CELL_SIZE[size] || 64

  const geometry = useMemo(() => {
    const windowSet = new Set(map.windows.map((w) => `${w.row},${w.col}`))
    const roomIndex = {}
    map.rooms.forEach((room, i) => (roomIndex[room.name] = i))

    // Celda que muestra la etiqueta de cada habitación (primera en lectura).
    const labelCell = {}
    for (const room of map.rooms) {
      const sorted = [...room.cells].sort((a, b) => a[0] - b[0] || a[1] - b[1])
      labelCell[`${sorted[0][0]},${sorted[0][1]}`] = room.name
    }

    const occupiable = (r, c) => {
      if (windowSet.has(`${r},${c}`)) return false
      const v = map.grid[r][c]
      return v === null || v === 'silla' || v === 'alfombra'
    }

    return { windowSet, roomIndex, labelCell, occupiable }
  }, [map])

  // Celdas bajo línea de control de cualquier ficha colocada.
  const controlled = useMemo(() => {
    const set = new Set()
    for (const name of Object.keys(placements)) {
      for (const [r, c] of controlLineCells(placements[name], size)) set.add(`${r},${c}`)
    }
    return set
  }, [placements, size])

  // En victoria, la línea de control del asesino.
  const killerLine = useMemo(() => {
    if (!revealMode || !killer) return new Set()
    const set = new Set()
    for (const [r, c] of controlLineCells(solution[killer], size)) set.add(`${r},${c}`)
    return set
  }, [revealMode, killer, solution, size])

  const occupantAt = useMemo(() => {
    const m = {}
    for (const name of Object.keys(placements)) {
      const p = placements[name]
      m[`${p.row},${p.col}`] = name
    }
    return m
  }, [placements])

  const bordersFor = (r, c) => {
    const room = roomLookup[`${r},${c}`]
    const diff = (nr, nc) =>
      nr < 0 || nc < 0 || nr >= size || nc >= size || roomLookup[`${nr},${nc}`] !== room
    return {
      top: diff(r - 1, c) ? BORDER_ROOM : BORDER_THIN,
      bottom: diff(r + 1, c) ? BORDER_ROOM : BORDER_THIN,
      left: diff(r, c - 1) ? BORDER_ROOM : BORDER_THIN,
      right: diff(r, c + 1) ? BORDER_ROOM : BORDER_THIN,
    }
  }

  const rows = []
  for (let r = 0; r < size; r++) {
    const cells = []
    for (let c = 0; c < size; c++) {
      const key = `${r},${c}`
      cells.push(
        <Cell
          key={key}
          r={r}
          c={c}
          size={cellSize}
          tint={ROOM_TINTS[geometry.roomIndex[roomLookup[key]] % ROOM_TINTS.length]}
          borders={bordersFor(r, c)}
          label={geometry.labelCell[key]}
          furniture={map.grid[r][c]}
          isWindow={geometry.windowSet.has(key)}
          occupiable={geometry.occupiable(r, c)}
          occupantName={occupantAt[key]}
          characters={characters}
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
