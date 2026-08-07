// Previsualización (solo lectura) del tipo de mapa que generará una dificultad.

import { useMemo, useState } from 'react'
import { generateMap, buildRoomLookup, rugBoundsOf } from '@/game/mapGenerator.js'
import { makeRng, randomSeed } from '@/game/random.js'
import { cellKey } from '@/game/constants.js'
import { themeForSeed } from './zones.js'
import { roomIndexByName } from './floorMaterials.js'
import { FurnitureIcon } from './Furniture.jsx'
import {
  WINDOW_BORDER_SIDE,
  windowBorder,
  windowGlassStyle,
  floorPatternStyle,
  rugFrameStyle,
  makeBordersFor,
} from './boardCell.js'

const PREVIEW_CELL_SIZE = { 4: 46, 5: 40, 6: 36, 7: 32 }

// Grosor del marco de ventana (px) e inset del cristal en la miniatura.
const WINDOW_FRAME_PX = 3
const GLASS_INSET = 6

export default function MapPreview({ difficulty, irregular = false }) {
  const [seed] = useState(() => randomSeed())

  const map = useMemo(
    () => generateMap(makeRng(seed), difficulty, { irregular }),
    [seed, difficulty, irregular],
  )
  const roomLookup = useMemo(() => buildRoomLookup(map), [map])
  const size = map.gridSize
  const cellSize = PREVIEW_CELL_SIZE[size] || 32
  const zone = themeForSeed(seed)

  // Mismos muros que el tablero, con el trazo adelgazado para que 5/3 px no se
  // coman una celda de 32. Se reutiliza la fábrica en vez del hook completo:
  // `useBoardGeometry` deriva el tamaño de celda de un listener de resize y
  // exige fichas, solución y asesino, nada de lo cual existe en la miniatura.
  const bordersFor = useMemo(
    () => makeBordersFor(map, roomLookup, size, zone, 0.6),
    [map, roomLookup, size, zone],
  )

  const windowByCell = useMemo(() => {
    const m = {}
    for (const w of map.windows) m[cellKey(w.row, w.col)] = w.wall
    return m
  }, [map])

  // Misma alfombra que el tablero: una sola capa con `border-image`, no una
  // por celda (ver rugBounds en useBoardGeometry.js / rugFrameStyle).
  const rugBounds = useMemo(() => rugBoundsOf(map), [map])

  const rows = []
  for (let r = 0; r < size; r++) {
    const cells = []
    for (let c = 0; c < size; c++) {
      const key = cellKey(r, c)
      // Celda void (mapa irregular): hueco transparente, se ve el marco.
      if (map.voidCells?.has(key)) {
        cells.push(<div key={key} style={{ width: cellSize, height: cellSize }} aria-hidden />)
        continue
      }
      const furniture = map.grid[r][c]
      const wall = windowByCell[key]
      const borders = bordersFor(r, c)
      const roomName = roomLookup[key]
      const isRug = furniture === 'alfombra'
      cells.push(
        <div
          key={key}
          className="relative"
          style={{
            width: cellSize,
            height: cellSize,
            // Transparente bajo la alfombra: la cubre la capa de más abajo.
            background: isRug ? 'transparent' : zone.tints[roomIndexByName(roomName) % zone.tints.length],
            borderTop: borders.top,
            borderRight: borders.right,
            borderBottom: borders.bottom,
            borderLeft: borders.left,
            ...(wall ? { [WINDOW_BORDER_SIDE[wall]]: windowBorder(zone, WINDOW_FRAME_PX) } : null),
          }}
        >
          {/* Suelo: el material lo pone la habitación, el color la zona. Se
              omite bajo la alfombra, que la cubre por completo. */}
          {!isRug && (
            <div
              className="pointer-events-none absolute inset-0"
              style={floorPatternStyle(zone, roomName, cellSize)}
            />
          )}
          {furniture && !isRug && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-70">
              <FurnitureIcon type={furniture} zone={zone} size={Math.round(cellSize * 0.5)} />
            </div>
          )}
          {wall && (
            <div
              className="pointer-events-none absolute"
              style={windowGlassStyle(zone, wall, GLASS_INSET)}
            />
          )}
        </div>,
      )
    }
    rows.push(
      <div key={r} className="flex">
        {cells}
      </div>,
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="pixel-frame relative inline-block overflow-hidden rounded-lg p-2.5 shadow-2xl"
        style={{ background: zone.frame.background }}
      >
        {/* Textura sutil propia de la zona. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ ...zone.ambient, opacity: zone.ambientOpacity, mixBlendMode: 'multiply' }}
          aria-hidden
        />
        {/* Alfombra: misma capa única con marco que en el tablero real (ver
            Board.jsx), posicionada antes que `rows` para pintar por detrás. */}
        {rugBounds && (
          <div
            className="pointer-events-none absolute box-border"
            style={{
              top: rugBounds.r0 * cellSize,
              left: rugBounds.c0 * cellSize,
              width: (rugBounds.c1 - rugBounds.c0 + 1) * cellSize,
              height: (rugBounds.r1 - rugBounds.r0 + 1) * cellSize,
              ...rugFrameStyle(zone, cellSize),
            }}
            aria-hidden
          />
        )}
        <div className="relative">{rows}</div>
        <span
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-plum-950/55 px-2 py-0.5 font-pixel text-[13px] font-medium text-cream-100 backdrop-blur-sm"
          style={{ boxShadow: `inset 0 0 0 1px ${zone.accentSoft}` }}
        >
          <zone.icon size={11} style={{ color: zone.accent }} />
          {zone.short}
        </span>
      </div>
    </div>
  )
}
