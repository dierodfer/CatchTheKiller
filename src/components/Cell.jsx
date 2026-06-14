// Una celda del tablero: tinte de habitación, mobiliario, ficha y línea de control.

import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { FurnitureIcon, WindowIcon } from './Furniture.jsx'
import { DraggableToken, TokenChip } from './CharacterToken.jsx'

export default function Cell({
  r,
  c,
  size,
  tint,
  borders,
  label,
  furniture,
  isWindow,
  occupiable,
  occupantName,
  characters,
  controlled,
  killerLine,
  hintTarget,
  selectedToken,
  onCellClick,
  onTokenClick,
  revealMode,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${r}-${c}`,
    disabled: !occupiable,
  })

  const tokenSize = Math.round(size * 0.62)
  const canDrop = occupiable && (isOver || (selectedToken && !occupantName))

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

      {/* Mobiliario / ventana de fondo. */}
      {!occupantName && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-70">
          {isWindow ? (
            <WindowIcon size={Math.round(size * 0.42)} className="text-sky-300/80" />
          ) : (
            <FurnitureIcon type={furniture} size={Math.round(size * 0.42)} className="text-slate-300/80" />
          )}
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
