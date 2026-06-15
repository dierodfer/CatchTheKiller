// Una celda del tablero: tinte de habitación, mobiliario, ficha y línea de control.
//
// `geometry` agrupa los datos estáticos de la celda (calculados una vez por
// puzzle en useBoardGeometry); el resto de props son estado dinámico de la
// partida. Memoizado: con `geometry`/`characters` de referencia estable, una
// celda solo se vuelve a renderizar si cambia su propio estado.

import { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { FurnitureIcon } from './Furniture.jsx'
import { DraggableToken, TokenChip } from './CharacterToken.jsx'
import { RUG_PATTERN, RUG_NOISE, RUG_NOISE_SIZE } from './rugPattern.js'
import { PixelGrid } from './pixelArt.jsx'
import { PIXEL_X_GRID, PIXEL_X_PALETTE, PIXEL_FLOOR_PATTERN } from './pixelSprites.js'

// Ventana integrada en la pared: el lado correspondiente del marco se marca en
// azul (estilo plano técnico) y se añade un cristal claro junto a él.
const WINDOW_BORDER_SIDE = {
  norte: 'borderTop',
  sur: 'borderBottom',
  oeste: 'borderLeft',
  este: 'borderRight',
}

const WINDOW_BORDER = '5px solid #6f9bc9'

const WINDOW_GLASS_POSITION = {
  norte: 'left-2 right-2 top-0.5 h-0.5',
  sur: 'left-2 right-2 bottom-0.5 h-0.5',
  oeste: 'top-2 bottom-2 left-0.5 w-0.5',
  este: 'top-2 bottom-2 right-0.5 w-0.5',
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
        ...(isWindow && wall ? { [WINDOW_BORDER_SIDE[wall]]: WINDOW_BORDER } : null),
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

      {/* Ventana: cristal claro junto al tramo de pared marcado en azul. */}
      {isWindow && wall && (
        <div
          className={`pointer-events-none absolute rounded-full bg-[#eaf3fb] ${WINDOW_GLASS_POSITION[wall]}`}
        />
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
