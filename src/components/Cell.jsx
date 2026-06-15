// Una celda del tablero: tinte de habitación, mobiliario, ficha y línea de control.
//
// `geometry` agrupa los datos estáticos de la celda (calculados una vez por
// puzzle en useBoardGeometry); el resto de props son estado dinámico de la
// partida. Memoizado: con `geometry`/`characters` de referencia estable, una
// celda solo se vuelve a renderizar si cambia su propio estado.

import { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { FurnitureIcon, WindowIcon } from './Furniture.jsx'
import { DraggableToken, TokenChip } from './CharacterToken.jsx'
import { RUG_PATTERN, RUG_NOISE, RUG_NOISE_SIZE } from './rugPattern.js'
import { PixelGrid } from './pixelArt.jsx'
import { PIXEL_X_GRID, PIXEL_X_PALETTE, PIXEL_FLOOR_PATTERN } from './pixelSprites.js'

// Posición del icono de ventana, anclado a la pared correspondiente.
const WALL_POSITION = {
  norte: 'top-0.5 left-1/2 -translate-x-1/2',
  sur: 'bottom-0.5 left-1/2 -translate-x-1/2',
  oeste: 'left-0.5 top-1/2 -translate-y-1/2',
  este: 'right-0.5 top-1/2 -translate-y-1/2',
}

function Cell({
  geometry,
  characters,
  occupantName,
  controlled,
  revealCell,
  selectedToken,
  onCellClick,
  onTokenClick,
  revealMode,
  windowColor = '#b9c2d6',
}) {
  const { r, c, size, tint, borders, label, furniture, isWindow, wall, rugEdges, occupiable } =
    geometry

  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${r}-${c}`,
    disabled: !occupiable,
  })

  const tokenSize = Math.round(size * 0.62)
  const canDrop = occupiable && (isOver || (selectedToken && !occupantName))
  const margin = Math.max(2, Math.round(size * 0.05))

  return (
    <div
      ref={setNodeRef}
      data-rc={`${r}-${c}`}
      onClick={() => occupiable && onCellClick(r, c)}
      className="relative flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: revealCell ? 'rgba(203,163,92,0.30)' : tint,
        borderTop: borders.top,
        borderRight: borders.right,
        borderBottom: borders.bottom,
        borderLeft: borders.left,
        cursor: occupiable && selectedToken && !occupantName ? 'pointer' : 'default',
        outline: canDrop ? '2px solid rgba(255,255,255,0.7)' : 'none',
        outlineOffset: -2,
      }}
    >
      {/* Suelo a baldosas: damero superpuesto al tinte de la habitación. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: PIXEL_FLOOR_PATTERN,
          backgroundSize: `${Math.max(4, Math.round(size / 4))}px ${Math.max(4, Math.round(size / 4))}px`,
          mixBlendMode: 'soft-light',
          opacity: 0.55,
        }}
      />

      {/* Etiqueta de habitación (una vez por habitación). */}
      {label && (
        <span className="pointer-events-none absolute left-1 top-0.5 font-pixel text-[12px] font-semibold uppercase tracking-[0.08em] text-plum-700/80">
          {label}
        </span>
      )}

      {/* Alfombra: relleno de fondo, puede abarcar varias celdas contiguas. */}
      {furniture === 'alfombra' && rugEdges && (
        <>
          <div
            className="pointer-events-none absolute"
            style={{
              top: rugEdges.top ? margin : 0,
              right: rugEdges.right ? margin : 0,
              bottom: rugEdges.bottom ? margin : 0,
              left: rugEdges.left ? margin : 0,
              borderTopLeftRadius: rugEdges.top && rugEdges.left ? 8 : 0,
              borderTopRightRadius: rugEdges.top && rugEdges.right ? 8 : 0,
              borderBottomLeftRadius: rugEdges.bottom && rugEdges.left ? 8 : 0,
              borderBottomRightRadius: rugEdges.bottom && rugEdges.right ? 8 : 0,
              background: RUG_PATTERN,
              opacity: 0.85,
            }}
          />
          <div
            className="pointer-events-none absolute"
            style={{
              top: rugEdges.top ? margin : 0,
              right: rugEdges.right ? margin : 0,
              bottom: rugEdges.bottom ? margin : 0,
              left: rugEdges.left ? margin : 0,
              borderTopLeftRadius: rugEdges.top && rugEdges.left ? 8 : 0,
              borderTopRightRadius: rugEdges.top && rugEdges.right ? 8 : 0,
              borderBottomLeftRadius: rugEdges.bottom && rugEdges.left ? 8 : 0,
              borderBottomRightRadius: rugEdges.bottom && rugEdges.right ? 8 : 0,
              backgroundImage: RUG_NOISE,
              backgroundSize: RUG_NOISE_SIZE,
              mixBlendMode: 'soft-light',
              opacity: 0.25,
            }}
          />
        </>
      )}

      {/* Mobiliario (excepto alfombra), oculto si hay una ficha encima. */}
      {!occupantName && furniture && furniture !== 'alfombra' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-75">
          <FurnitureIcon type={furniture} size={Math.round(size * 0.42)} className="text-plum-700/70" />
        </div>
      )}

      {/* Ventana: icono anclado a la pared, visible aunque haya una ficha. */}
      {isWindow && (
        <div
          className={`pointer-events-none absolute ${WALL_POSITION[wall] || ''}`}
          style={{ color: windowColor }}
        >
          <WindowIcon size={Math.round(size * 0.34)} className="opacity-85" />
        </div>
      )}

      {/* Marca × de línea de control. */}
      {controlled && !occupantName && (
        <PixelGrid
          grid={PIXEL_X_GRID}
          palette={PIXEL_X_PALETTE}
          size={Math.round(size * 0.7)}
          className="pointer-events-none absolute"
        />
      )}

      {/* Ficha colocada. */}
      {occupantName && (
        <motion.div layoutId={`token-${occupantName}`} className="absolute">
          {revealMode ? (
            <TokenChip
              name={occupantName}
              characters={characters}
              size={tokenSize}
              highlight={revealCell ? '#a07d3c' : undefined}
            />
          ) : (
            <DraggableToken
              name={occupantName}
              characters={characters}
              size={tokenSize}
              onClick={(e) => {
                e.stopPropagation()
                onTokenClick(occupantName)
              }}
            />
          )}
        </motion.div>
      )}
    </div>
  )
}

export default memo(Cell)
