// El tablero: renderiza la cuadrícula de celdas (con numeración de filas y
// columnas) a partir de la geometría calculada por useBoardGeometry.

import { motion, useReducedMotion } from 'framer-motion'
import { cellKey } from '@/game/constants.js'
import Cell from './Cell.jsx'
import { Rug } from './Rug.jsx'
import { GUTTER, useBoardGeometry } from '@/hooks/useBoardGeometry.js'

export default function Board({
  puzzle,
  placements,
  selectedToken,
  onCellClick,
  onTokenClick,
  revealMode,
  zone,
  celebrating = false,
  draggingName,
  marks,
  markingCell,
  onMarkToggle,
  onMarkOpen,
  onMarkClose,
}) {
  const { map, roomLookup, characters, solution, killer } = puzzle
  const { size, cellSize, cellGeometry, controlled, revealRoom, occupantAt, rugBounds } = useBoardGeometry({
    map,
    roomLookup,
    zone,
    placements,
    revealMode,
    killer,
    victim: characters.victim,
    solution,
    draggingName,
  })
  const reduce = useReducedMotion()

  const axisLabel = 'flex items-center justify-center font-pixel text-[13px] font-semibold text-plum-600/70'

  // Cabecera: esquina vacía + número de cada columna. Los números de los ejes
  // son decorativos (aria-hidden): cada celda ya anuncia su fila y columna.
  const header = (
    <div className="flex">
      <div style={{ width: GUTTER, height: GUTTER }} />
      {Array.from({ length: size }, (_, c) => (
        <div key={c} className={axisLabel} style={{ width: cellSize, height: GUTTER }} aria-hidden>
          {String.fromCodePoint(65 + c)}
        </div>
      ))}
    </div>
  )

  const rows = []
  for (let r = 0; r < size; r++) {
    const cells = []
    for (let c = 0; c < size; c++) {
      const key = cellKey(r, c)
      cells.push(
        <Cell
          key={key}
          geometry={cellGeometry[r][c]}
          zone={zone}
          characters={characters}
          occupantName={occupantAt[key]}
          controlled={controlled.has(key)}
          revealCell={revealRoom.has(key)}
          selectedToken={selectedToken}
          onCellClick={onCellClick}
          onTokenClick={onTokenClick}
          revealMode={revealMode}
          marks={marks}
          markingCell={markingCell}
          onMarkToggle={onMarkToggle}
          onMarkOpen={onMarkOpen}
          onMarkClose={onMarkClose}
        />,
      )
    }
    rows.push(
      <div key={r} className="flex">
        {/* Número de fila (decorativo). */}
        <div className={axisLabel} style={{ width: GUTTER, height: cellSize }} aria-hidden>
          {r + 1}
        </div>
        {cells}
      </div>,
    )
  }

  // Alfombra: UNA capa a nivel de tablero, no por celda (ver Rug.jsx). Va
  // ANTES que `rows` a propósito: pinta por detrás, y las celdas de alfombra
  // dejan su fondo transparente (ver Cell.jsx) para que se vea a través; el
  // resto de celdas no se entera, pintan encima como siempre. Así la ficha o
  // la marca que caiga sobre la alfombra sigue quedando por delante sin
  // ningún z-index.
  const rugLayer = rugBounds ? (
    <div className="pointer-events-none absolute inset-0" style={{ top: GUTTER }} aria-hidden>
      <Rug
        zone={zone}
        cellSize={cellSize}
        bounds={rugBounds}
        offsetX={GUTTER}
        // La alfombra cae siempre dentro de una sola habitación, así que su
        // esquina superior izquierda basta para saber qué suelo pintar debajo.
        roomName={cellGeometry[rugBounds.r0][rugBounds.c0].roomName}
        tint={cellGeometry[rugBounds.r0][rugBounds.c0].tint}
      />
    </div>
  ) : null

  // Celebración: la escena se ilumina habitación por habitación, trazando la
  // forma real de cada sala con un resplandor dorado escalonado.
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
                background: `radial-gradient(circle at 50% 50%, ${zone.glow}, transparent 75%)`,
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
    // <fieldset> es el elemento nativo con rol "group". `minInlineSize: auto`
    // anula su ancho mínimo por defecto (min-content), que descuadraría la
    // rejilla.
    <fieldset
      className="pixel-frame relative inline-block overflow-hidden rounded-lg p-2.5 shadow-2xl"
      style={{ minInlineSize: 'auto', background: zone.frame.background }}
      aria-label="Tablero del caso"
    >
      {/* Textura ambiental propia de la zona. La opacidad va en el estilo, no en
          una clase: cada zona calibra la suya. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ ...zone.ambient, opacity: zone.ambientOpacity, mixBlendMode: 'multiply' }}
        aria-hidden
      />
      <div className="relative">
        {header}
        {rugLayer}
        {rows}
        {celebrationLayer}
      </div>
    </fieldset>
  )
}
