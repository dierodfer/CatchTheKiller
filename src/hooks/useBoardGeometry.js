// Geometría del tablero: separa el cálculo (memoizado) de su renderizado en
// Board/Cell.
//
// `cellGeometry` es estática para un puzzle dado (no depende de las fichas
// colocadas), por lo que cada objeto de celda mantiene su identidad de
// referencia entre renders — clave para que React.memo en Cell evite
// renderizados innecesarios al colocar/quitar fichas.

import { useMemo } from 'react'
import { ROOM_TINTS } from '@/components/palette.js'
import { controlLineCells } from '@/game/killerRule.js'
import { isOccupiable } from '@/game/mapGenerator.js'

const CELL_SIZE = { 4: 80, 5: 68, 6: 58, 7: 50 }
const BORDER_ROOM = '2px solid rgba(148,163,184,0.55)'
const BORDER_THIN = '1px solid rgba(148,163,184,0.12)'

export function useBoardGeometry({
  map,
  roomLookup,
  placements,
  revealMode,
  killer,
  victim,
  solution,
}) {
  const size = map.gridSize
  const cellSize = CELL_SIZE[size] || 64

  const cellGeometry = useMemo(() => {
    const windowByCell = {}
    for (const w of map.windows) windowByCell[`${w.row},${w.col}`] = w.wall
    const roomIndex = {}
    map.rooms.forEach((room, i) => (roomIndex[room.name] = i))

    // Celda que muestra la etiqueta de cada habitación (primera en lectura).
    const labelCell = {}
    for (const room of map.rooms) {
      const sorted = [...room.cells].sort((a, b) => a[0] - b[0] || a[1] - b[1])
      labelCell[`${sorted[0][0]},${sorted[0][1]}`] = room.name
    }

    // Bordes de la alfombra: marca los lados que no continúan en otra celda
    // de alfombra, para dibujar el contorno redondeado solo en el perímetro.
    const isRug = (r, c) =>
      r >= 0 && c >= 0 && r < size && c < size && map.grid[r][c] === 'alfombra'

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

    const grid = []
    for (let r = 0; r < size; r++) {
      const row = []
      for (let c = 0; c < size; c++) {
        const key = `${r},${c}`
        const furniture = map.grid[r][c]
        row.push({
          r,
          c,
          size: cellSize,
          tint: ROOM_TINTS[roomIndex[roomLookup[key]] % ROOM_TINTS.length],
          borders: bordersFor(r, c),
          label: labelCell[key],
          furniture,
          isWindow: key in windowByCell,
          wall: windowByCell[key],
          rugEdges:
            furniture === 'alfombra'
              ? {
                  top: !isRug(r - 1, c),
                  bottom: !isRug(r + 1, c),
                  left: !isRug(r, c - 1),
                  right: !isRug(r, c + 1),
                }
              : null,
          occupiable: isOccupiable(map, r, c),
        })
      }
      grid.push(row)
    }
    return grid
  }, [map, roomLookup, size, cellSize])

  // Celdas bajo línea de control de cualquier ficha colocada.
  const controlled = useMemo(() => {
    const set = new Set()
    for (const name of Object.keys(placements)) {
      for (const [r, c] of controlLineCells(placements[name], size)) set.add(`${r},${c}`)
    }
    return set
  }, [placements, size])

  // En la revelación, la habitación donde el asesino estaba a solas con la
  // víctima (resaltada para explicar visualmente la regla).
  const revealRoom = useMemo(() => {
    if (!revealMode || !killer) return new Set()
    const v = solution[victim]
    const room = roomLookup[`${v.row},${v.col}`]
    const set = new Set()
    for (const key of Object.keys(roomLookup)) {
      if (roomLookup[key] === room) set.add(key)
    }
    return set
  }, [revealMode, killer, victim, solution, roomLookup])

  const occupantAt = useMemo(() => {
    const m = {}
    for (const name of Object.keys(placements)) {
      const p = placements[name]
      m[`${p.row},${p.col}`] = name
    }
    return m
  }, [placements])

  return { size, cellSize, cellGeometry, controlled, revealRoom, occupantAt }
}
