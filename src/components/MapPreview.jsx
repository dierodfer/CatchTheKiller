// Previsualización (solo lectura) del tipo de mapa que generará una dificultad.

import { useMemo, useState } from 'react'
import { generateMap, buildRoomLookup } from '@/game/mapGenerator.js'
import { makeRng, randomSeed } from '@/game/random.js'
import { cellKey } from '@/game/constants.js'
import { ROOM_TINTS } from './palette.js'
import { zoneForSeed } from './zones.js'
import { FurnitureIcon } from './Furniture.jsx'
import {
  WINDOW_BORDER_SIDE,
  WINDOW_GLASS_COLOR,
  windowBorder,
  windowGlassStyle,
  floorPatternStyle,
  rugLayerStyles,
} from './boardCell.js'

const PREVIEW_CELL_SIZE = { 4: 46, 5: 40, 6: 36, 7: 32 }

// Grosor del marco de ventana (px) e inset del cristal en la miniatura.
const WINDOW_FRAME_PX = 3
const GLASS_INSET = 6

export default function MapPreview({ difficulty }) {
  const [seed] = useState(() => randomSeed())

  const map = useMemo(() => generateMap(makeRng(seed), difficulty), [seed, difficulty])
  const roomLookup = useMemo(() => buildRoomLookup(map), [map])
  const size = map.gridSize
  const cellSize = PREVIEW_CELL_SIZE[size] || 32
  const zone = zoneForSeed(seed)

  const roomIndex = useMemo(() => {
    const idx = {}
    map.rooms.forEach((room, i) => (idx[room.name] = i))
    return idx
  }, [map])

  const windowByCell = useMemo(() => {
    const m = {}
    for (const w of map.windows) m[cellKey(w.row, w.col)] = w.wall
    return m
  }, [map])

  const isRug = (r, c) =>
    r >= 0 && c >= 0 && r < size && c < size && map.grid[r][c] === 'alfombra'

  const rows = []
  for (let r = 0; r < size; r++) {
    const cells = []
    for (let c = 0; c < size; c++) {
      const key = cellKey(r, c)
      const furniture = map.grid[r][c]
      const wall = windowByCell[key]
      const margin = Math.max(2, Math.round(cellSize * 0.05))
      const edges = {
        top: !isRug(r - 1, c),
        bottom: !isRug(r + 1, c),
        left: !isRug(r, c - 1),
        right: !isRug(r, c + 1),
      }
      cells.push(
        <div
          key={key}
          className="relative"
          style={{
            width: cellSize,
            height: cellSize,
            background: ROOM_TINTS[roomIndex[roomLookup[key]] % ROOM_TINTS.length],
            border: '1px solid rgba(39,24,41,0.16)',
            ...(wall ? { [WINDOW_BORDER_SIDE[wall]]: windowBorder(WINDOW_FRAME_PX) } : null),
          }}
        >
          {/* Suelo a baldosas: damero superpuesto al tinte de la habitación. */}
          <div className="pointer-events-none absolute inset-0" style={floorPatternStyle(cellSize)} />
          {furniture === 'alfombra' &&
            rugLayerStyles(edges, margin, 6).map((style, i) => (
              <div key={i} className="pointer-events-none absolute" style={style} />
            ))}
          {furniture && furniture !== 'alfombra' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-70">
              <FurnitureIcon
                type={furniture}
                size={Math.round(cellSize * 0.5)}
                className="text-plum-700/70"
              />
            </div>
          )}
          {wall && (
            <div
              className="pointer-events-none absolute rounded-full"
              style={{ background: WINDOW_GLASS_COLOR, ...windowGlassStyle(wall, GLASS_INSET) }}
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
      <div className="pixel-frame relative inline-block overflow-hidden rounded-lg bg-cream-100/80 p-2.5 shadow-2xl">
        {/* Textura sutil propia de la zona. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ backgroundImage: zone.texture, mixBlendMode: 'multiply' }}
          aria-hidden
        />
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
