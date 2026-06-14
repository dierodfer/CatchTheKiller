// Previsualización (solo lectura) del tipo de mapa que generará una dificultad.

import { useMemo, useState } from 'react'
import { Shuffle } from 'lucide-react'
import { generateMap, buildRoomLookup } from '@/game/mapGenerator.js'
import { makeRng, randomSeed } from '@/game/random.js'
import { ROOM_TINTS } from './palette.js'
import { zoneForSeed } from './zones.js'
import { FurnitureIcon, WindowIcon } from './Furniture.jsx'

const PREVIEW_CELL_SIZE = { 4: 46, 5: 40, 6: 36, 7: 32 }

const WALL_POSITION = {
  norte: 'top-0.5 left-1/2 -translate-x-1/2',
  sur: 'bottom-0.5 left-1/2 -translate-x-1/2',
  oeste: 'left-0.5 top-1/2 -translate-y-1/2',
  este: 'right-0.5 top-1/2 -translate-y-1/2',
}

export default function MapPreview({ difficulty }) {
  const [seed, setSeed] = useState(() => randomSeed())

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
    for (const w of map.windows) m[`${w.row},${w.col}`] = w.wall
    return m
  }, [map])

  const isRug = (r, c) =>
    r >= 0 && c >= 0 && r < size && c < size && map.grid[r][c] === 'alfombra'

  const rows = []
  for (let r = 0; r < size; r++) {
    const cells = []
    for (let c = 0; c < size; c++) {
      const key = `${r},${c}`
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
            border: '1px solid rgba(244,235,220,0.07)',
          }}
        >
          {furniture === 'alfombra' && (
            <div
              className="pointer-events-none absolute"
              style={{
                top: edges.top ? margin : 0,
                right: edges.right ? margin : 0,
                bottom: edges.bottom ? margin : 0,
                left: edges.left ? margin : 0,
                borderRadius: 6,
                background:
                  'repeating-linear-gradient(45deg, rgba(203,163,92,0.42) 0 5px, rgba(116,82,122,0.42) 5px 10px)',
                opacity: 0.85,
              }}
            />
          )}
          {furniture && furniture !== 'alfombra' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-70">
              <FurnitureIcon
                type={furniture}
                size={Math.round(cellSize * 0.5)}
                className="text-cream-soft/80"
              />
            </div>
          )}
          {wall && (
            <div
              className={`pointer-events-none absolute ${WALL_POSITION[wall] || ''}`}
              style={{ color: zone.accent }}
            >
              <WindowIcon size={Math.round(cellSize * 0.36)} className="opacity-80" />
            </div>
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
      <div className="relative inline-block overflow-hidden rounded-2xl border border-gold/15 bg-plum-850/70 p-2.5 shadow-2xl ring-botanica">
        {/* Textura sutil propia de la zona. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ backgroundImage: zone.texture }}
          aria-hidden
        />
        <div className="relative">{rows}</div>
        <span
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-plum-950/70 px-2 py-0.5 text-[10px] font-medium text-cream-soft backdrop-blur-sm"
          style={{ boxShadow: `inset 0 0 0 1px ${zone.accentSoft}` }}
        >
          <zone.icon size={11} style={{ color: zone.accent }} />
          {zone.short}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setSeed(randomSeed())}
        className="inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-plum-800/50 px-3.5 py-1.5 text-xs font-medium text-cream-soft transition hover:bg-plum-700/60 hover:text-cream"
      >
        <Shuffle size={13} /> Otro mapa de ejemplo
      </button>
    </div>
  )
}
