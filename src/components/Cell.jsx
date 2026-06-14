// Una celda del tablero: tinte de habitación, mobiliario, ficha y línea de control.
//
// `geometry` agrupa los datos estáticos de la celda (calculados una vez por
// puzzle en useBoardGeometry); el resto de props son estado dinámico de la
// partida. Memoizado: con `geometry`/`characters` de referencia estable, una
// celda solo se vuelve a renderizar si cambia su propio estado.

import { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { FurnitureIcon, WindowIcon } from './Furniture.jsx'
import { DraggableToken, TokenChip } from './CharacterToken.jsx'

// Posición del icono de ventana, anclado a la pared correspondiente.
const WALL_POSITION = {
  norte: 'top-0.5 left-1/2 -translate-x-1/2',
  sur: 'bottom-0.5 left-1/2 -translate-x-1/2',
  oeste: 'left-0.5 top-1/2 -translate-y-1/2',
  este: 'right-0.5 top-1/2 -translate-y-1/2',
}

const RUG_PATTERN =
  'repeating-linear-gradient(45deg, rgba(217,119,6,0.45) 0 6px, rgba(120,53,15,0.45) 6px 12px)'

function Cell({
  geometry,
  characters,
  occupantName,
  controlled,
  killerLine,
  hintTarget,
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
      onClick={() => occupiable && onCellClick(r, c)}
      className="relative flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: killerLine ? 'rgba(192,57,43,0.22)' : tint,
        borderTop: borders.top,
        borderRight: borders.right,
        borderBottom: borders.bottom,
        borderLeft: borders.left,
        cursor: occupiable && selectedToken && !occupantName ? 'pointer' : 'default',
        outline: canDrop ? '2px solid rgba(255,255,255,0.7)' : 'none',
        outlineOffset: -2,
      }}
    >
      {/* Etiqueta de habitación (una vez por habitación). */}
      {label && (
        <span className="pointer-events-none absolute left-1 top-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-300/80">
          {label}
        </span>
      )}

      {/* Alfombra: relleno de fondo, puede abarcar varias celdas contiguas. */}
      {furniture === 'alfombra' && rugEdges && (
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
      )}

      {/* Mobiliario (excepto alfombra), oculto si hay una ficha encima. */}
      {!occupantName && furniture && furniture !== 'alfombra' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-70">
          <FurnitureIcon type={furniture} size={Math.round(size * 0.42)} className="text-slate-300/80" />
        </div>
      )}

      {/* Ventana: icono anclado a la pared, visible aunque haya una ficha. */}
      {isWindow && (
        <div className={`pointer-events-none absolute ${WALL_POSITION[wall] || ''}`}>
          <WindowIcon size={Math.round(size * 0.34)} className="text-sky-300/80" />
        </div>
      )}

      {/* Marca × de línea de control. */}
      {controlled && !occupantName && (
        <X
          size={Math.round(size * 0.7)}
          className="pointer-events-none absolute text-white/15"
          strokeWidth={1.5}
        />
      )}

      {/* Resalte de la celda revelada por una pista de ayuda. */}
      {hintTarget && !occupantName && (
        <span className="pointer-events-none absolute inset-1 animate-pulse rounded-md ring-2 ring-amber-300/80" />
      )}

      {/* Ficha colocada. */}
      {occupantName && (
        <motion.div layoutId={`token-${occupantName}`} className="absolute">
          {revealMode ? (
            <TokenChip
              name={occupantName}
              characters={characters}
              size={tokenSize}
              highlight={killerLine ? '#f59e0b' : undefined}
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
