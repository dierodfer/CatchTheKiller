// Geometría del tablero: separa el cálculo (memoizado) de su renderizado en
// Board/Cell.
//
// `cellGeometry` es estática para un puzzle dado (no depende de las fichas
// colocadas), por lo que cada objeto de celda mantiene su identidad de
// referencia entre renders — clave para que React.memo en Cell evite
// renderizados innecesarios al colocar/quitar fichas.

import { useEffect, useMemo, useState } from 'react'
import { makeBordersFor } from '@/components/boardCell.js'
import { roomIndexByName } from '@/components/floorMaterials.js'
import { controlLineCells } from '@/game/killerRule.js'
import { isOccupiable } from '@/game/mapGenerator.js'

// Ancho de la columna/fila de numeración (1, 2, 3...) en los bordes del tablero.
export const GUTTER = 18

// Tamaño de celda en pantallas amplias, donde no hay restricción de ancho.
const MAX_CELL_SIZE = { 4: 112, 5: 94, 6: 78, 7: 66 }
// Por debajo de este tamaño la cuadrícula deja de ser legible: a partir de
// aquí se prefiere un desbordamiento mínimo a celdas ilegibles.
const MIN_CELL_SIZE = 36

// Ancho fuera del tablero que compite por el viewport: relleno horizontal de
// la página (`px-3`/`sm:px-4` en GameScreen) más el relleno del marco del
// tablero (`p-2.5`).
const PAGE_PADDING = 24
const PAGE_PADDING_SM = 32
const BOARD_PADDING = 20
const SM_BREAKPOINT = 640

// Mantiene `cellSize` ajustado al ancho de la ventana, recalculando en cada
// redimensionado (p. ej. al rotar el dispositivo).
function useViewportWidth() {
  const [width, setWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth,
  )
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return width
}

export function useBoardGeometry({
  map,
  roomLookup,
  zone,
  placements,
  revealMode,
  killer,
  victim,
  solution,
  draggingName,
}) {
  const size = map.gridSize
  const viewportWidth = useViewportWidth()
  const pagePadding = viewportWidth >= SM_BREAKPOINT ? PAGE_PADDING_SM : PAGE_PADDING
  const available = viewportWidth - pagePadding - BOARD_PADDING - GUTTER
  const cellSize = Math.min(
    MAX_CELL_SIZE[size] || 80,
    Math.max(MIN_CELL_SIZE, Math.floor(available / size)),
  )

  const cellGeometry = useMemo(() => {
    const windowByCell = {}
    for (const w of map.windows) windowByCell[`${w.row},${w.col}`] = w.wall
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

    // Muros con los colores y grosores de la zona (misma fábrica que usa la
    // miniatura, para que tablero y preview no se desincronicen).
    const bordersFor = makeBordersFor(map, roomLookup, size, zone)

    const grid = []
    for (let r = 0; r < size; r++) {
      const row = []
      for (let c = 0; c < size; c++) {
        const key = `${r},${c}`
        // Celda void (mapa irregular): hueco no jugable, se pinta como exterior.
        if (map.voidCells?.has(key)) {
          row.push({ r, c, size: cellSize, isVoid: true, occupiable: false })
          continue
        }
        const furniture = map.grid[r][c]
        const roomName = roomLookup[key]
        row.push({
          r,
          c,
          size: cellSize,
          roomName,
          // Tinte indexado por el NOMBRE de la sala, no por el orden en que el
          // generador la creó: así la Cocina sale siempre del mismo tono, a
          // juego con su suelo de baldosa.
          tint: zone.tints[roomIndexByName(roomName) % zone.tints.length],
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
  }, [map, roomLookup, size, cellSize, zone])

  // Celdas bajo línea de control de cualquier ficha colocada. La ficha que se
  // está arrastrando no aporta su línea de control: al "levantarla" del
  // tablero, sus marcas de control desaparecen mientras está en el aire.
  const controlled = useMemo(() => {
    const set = new Set()
    for (const name of Object.keys(placements)) {
      if (name === draggingName) continue
      for (const [r, c] of controlLineCells(placements[name], map)) set.add(`${r},${c}`)
    }
    return set
  }, [placements, map, draggingName])

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
