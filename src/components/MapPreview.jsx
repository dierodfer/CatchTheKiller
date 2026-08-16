// Previsualización (solo lectura) del tipo de mapa que generará una dificultad.

import { useMemo, useState } from 'react'
import { generateMap, buildRoomLookup, rugBoundsOf } from '@/game/mapGenerator.js'
import { makeRng, randomSeed } from '@/game/random.js'
import { cellKey } from '@/game/constants.js'
import { themeForSeed } from './zones.js'
import { buildCellGeometry, rugTintOf } from './cellGeometry.js'
import { FurnitureIcon } from './Furniture.jsx'
import {
  WINDOW_BORDER_SIDE,
  windowBorder,
  windowGlassStyle,
  floorPatternStyle,
} from './boardCell.js'
import { Rug } from './Rug.jsx'

const PREVIEW_CELL_SIZE = { 4: 46, 5: 40, 6: 36, 7: 32, 8: 28, 9: 25 }

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

  // La MISMA geometría que el tablero real (ver cellGeometry.js), no una copia:
  // así un cambio de muros, suelo o tintes sale a la vez en los dos sitios. Se
  // usa la función y no `useBoardGeometry` porque el hook deriva el tamaño de
  // celda de un listener de resize y exige fichas, solución y asesino, nada de
  // lo cual existe en la miniatura. `borderScale: 0.6` adelgaza el trazo para
  // que 5 px de muro no se coman una celda de 32.
  const cells = useMemo(
    () => buildCellGeometry({ map, roomLookup, zone, cellSize, borderScale: 0.6 }),
    [map, roomLookup, zone, cellSize],
  )

  // Misma alfombra que el tablero: una sola capa, no una por celda (ver
  // rugBounds en useBoardGeometry.js y Rug.jsx).
  const rugBounds = useMemo(() => rugBoundsOf(map), [map])
  const rugTint = rugTintOf(zone, roomLookup, rugBounds)

  const rows = cells.map((row) => (
    <div key={row[0].r} className="flex">
      {row.map((cell) => {
        const key = cellKey(cell.r, cell.c)
        // Celda void (mapa irregular): hueco transparente, se ve el marco.
        if (cell.isVoid) {
          return <div key={key} style={{ width: cellSize, height: cellSize }} aria-hidden />
        }
        const { roomName, furniture, wall, borders } = cell
        const isRug = furniture === 'alfombra'
        return (
          <div
            key={key}
            className="relative"
            style={{
              width: cellSize,
              height: cellSize,
              // Transparente bajo la alfombra: la cubre la capa de más abajo.
              background: isRug ? 'transparent' : cell.tint,
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
          </div>
        )
      })}
    </div>
  ))

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="pixel-frame relative inline-block overflow-hidden rounded-lg p-2.5 shadow-2xl"
        style={{ background: zone.frame.background }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ ...zone.ambient, opacity: zone.ambientOpacity, mixBlendMode: 'multiply' }}
          aria-hidden
        />
        {/* Alfombra: la misma capa única que en el tablero real (ver Rug.jsx),
            posicionada antes que `rows` para pintar por detrás. Va DENTRO del
            envoltorio relativo de la rejilla, no suelta en el marco: `inset-0`
            se resuelve contra la caja de relleno del ancestro posicionado, así
            que colgándola del marco la alfombra salía desplazada los 10 px del
            `p-2.5` y se comía el canto de la miniatura. */}
        <div className="relative">
          {rugBounds && (
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <Rug
                zone={zone}
                cellSize={cellSize}
                bounds={rugBounds}
                roomName={roomLookup[cellKey(rugBounds.r0, rugBounds.c0)]}
                tint={rugTint}
              />
            </div>
          )}
          {rows}
        </div>
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
