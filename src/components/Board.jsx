// El tablero: renderiza la cuadrícula de celdas (con numeración de filas y
// columnas) a partir de la geometría calculada por useBoardGeometry.

import { motion, useReducedMotion } from 'framer-motion'
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
  zone,
  celebrating = false,
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
  const reduce = useReducedMotion()

  const axisLabel = 'flex items-center justify-center font-pixel text-[13px] font-semibold text-plum-600/70'

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
          windowColor={zone?.accent}
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

  // Celebración: la escena se ilumina habitación por habitación, trazando la
  // forma real de cada sala con un resplandor dorado escalonado.
  const glowGold = zone?.glow || 'rgba(160, 125, 60, 0.35)'
  const celebrationLayer =
    celebrating && !reduce ? (
      <div className="pointer-events-none absolute inset-0" style={{ top: GUTTER }} aria-hidden>
        {map.rooms.map((room, ri) =>
          room.cells.map(([r, c]) => (
            <motion.div
              key={`${ri}-${r}-${c}`}
              className="absolute rounded-[3px]"
              style={{
                top: r * cellSize,
                left: GUTTER + c * cellSize,
                width: cellSize,
                height: cellSize,
                background: `radial-gradient(circle at 50% 50%, ${glowGold}, transparent 75%)`,
                mixBlendMode: 'multiply',
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 0.55], scale: [0.6, 1.12, 1] }}
              transition={{ delay: 0.15 + ri * 0.36, duration: 1.2, ease: 'easeOut' }}
            />
          )),
        )}
      </div>
    ) : null

  return (
    <div className="pixel-frame relative inline-block overflow-hidden rounded-lg bg-cream-100/75 p-2.5 shadow-2xl">
      {/* Textura ambiental propia de la zona. */}
      {zone && (
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ backgroundImage: zone.texture, mixBlendMode: 'multiply' }}
          aria-hidden
        />
      )}
      <div className="relative">
        {header}
        {rows}
        {celebrationLayer}
      </div>
    </div>
  )
}
