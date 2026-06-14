// Ficha de personaje: visual + envoltorio arrastrable (dnd-kit).

import { useDraggable } from '@dnd-kit/core'
import { User, Skull } from 'lucide-react'
import { colorForCharacter } from './palette.js'

// Visual puro (reutilizado en bandeja, tablero y DragOverlay).
export function TokenChip({ name, characters, size = 40, dimmed = false, highlight }) {
  const color = colorForCharacter(name, characters)
  const isVictim = name === characters.victim
  const dim = dimmed ? 0.45 : 1
  const iconSize = size * 0.5
  return (
    <div
      className="no-select flex flex-col items-center gap-0.5"
      style={{ opacity: dim }}
      title={name}
    >
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        {isVictim ? (
          <Skull size={iconSize} color={color.bg} />
        ) : (
          <User size={iconSize} color={color.bg} />
        )}
        {highlight && (
          <div
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: '50%',
              border: `3px solid ${highlight}`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
      <span className="max-w-[72px] truncate text-[11px] font-medium text-slate-200">
        {name}
      </span>
    </div>
  )
}

// Ficha arrastrable; también admite click (seleccionar / recoger).
export function DraggableToken({ name, characters, size, onClick, selected }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: name })
  const color = colorForCharacter(name, characters)
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className="outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      style={{ touchAction: 'none', cursor: 'grab', opacity: isDragging ? 0 : 1 }}
    >
      <TokenChip
        name={name}
        characters={characters}
        size={size}
        highlight={selected ? color.ring : null}
      />
    </button>
  )
}
