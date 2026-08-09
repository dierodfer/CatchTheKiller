// Geometría del tablero: separa el cálculo (memoizado) de su renderizado en
// Board/Cell.
//
// `cellGeometry` es estática para un puzzle dado (no depende de las fichas
// colocadas), por lo que cada objeto de celda mantiene su identidad de
// referencia entre renders — clave para que React.memo en Cell evite
// renderizados innecesarios al colocar/quitar fichas.

import { useEffect, useMemo, useState } from 'react'
import { buildCellGeometry } from '@/components/cellGeometry.js'
import { cellKey } from '@/game/constants.js'
import { controlLineCells } from '@/game/killerRule.js'
import { rugBoundsOf } from '@/game/mapGenerator.js'

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

  // El cálculo lo comparte con la miniatura de la pantalla de inicio (ver
  // cellGeometry.js); aquí solo se memoiza, porque el tablero lo rehace cada
  // vez que el redimensionado de la ventana cambia el tamaño de celda.
  const cellGeometry = useMemo(
    () => buildCellGeometry({ map, roomLookup, zone, cellSize }),
    [map, roomLookup, zone, cellSize],
  )

  // Celdas bajo línea de control de cualquier ficha colocada. La ficha que se
  // está arrastrando no aporta su línea de control: al "levantarla" del
  // tablero, sus marcas de control desaparecen mientras está en el aire.
  const controlled = useMemo(() => {
    const set = new Set()
    for (const name of Object.keys(placements)) {
      if (name === draggingName) continue
      for (const [r, c] of controlLineCells(placements[name], map)) set.add(cellKey(r, c))
    }
    return set
  }, [placements, map, draggingName])

  // En la revelación, la habitación donde el asesino estaba a solas con la
  // víctima (resaltada para explicar visualmente la regla).
  const revealRoom = useMemo(() => {
    if (!revealMode || !killer) return new Set()
    const v = solution[victim]
    const room = roomLookup[cellKey(v.row, v.col)]
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
      m[cellKey(p.row, p.col)] = name
    }
    return m
  }, [placements])

  // Rectángulo (en celdas) de la alfombra, o `null` si el mapa no tiene una.
  // Se dibuja como una sola capa a nivel de tablero, no por celda (ver Rug.jsx).
  const rugBounds = useMemo(() => rugBoundsOf(map), [map])

  return { size, cellSize, cellGeometry, controlled, revealRoom, occupantAt, rugBounds }
}
