// Ficha de personaje: visual + envoltorio arrastrable (dnd-kit).

import { useDraggable } from '@dnd-kit/core'
import { colorForCharacter } from './palette.js'
import { PixelAvatar } from './pixelArt.jsx'

// Visual puro (reutilizado en bandeja, tablero y DragOverlay).
export function TokenChip({ name, characters, size = 40, dimmed = false, highlight }) {
  const color = colorForCharacter(name, characters)
  const isVictim = name === characters.victim
  const dim = dimmed ? 0.45 : 1
  const iconSize = Math.round(size * 0.62)
  return (
    <div
      className="no-select flex flex-col items-center gap-0.5"
      style={{ opacity: dim }}
      title={name}
    >
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <PixelAvatar color={color.bg} isVictim={isVictim} size={iconSize} />
        {highlight && (
          <div
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: 4,
              border: `3px solid ${highlight}`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
      <span className="max-w-[72px] truncate text-[11px] font-medium text-plum-800">
        {name}
      </span>
    </div>
  )
}

// Ficha arrastrable; también admite click (seleccionar / recoger).
export function DraggableToken({ name, characters, size, onClick, selected }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: name })
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className="rounded-lg outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-gold-deep"
      style={{ touchAction: 'none', cursor: 'grab', opacity: isDragging ? 0 : 1 }}
    >
      <TokenChip
        name={name}
        characters={characters}
        size={size}
        highlight={selected ? 'rgba(160,125,60,0.55)' : null}
      />
    </button>
  )
}
