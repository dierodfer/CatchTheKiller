// Ficha de personaje: visual + envoltorio arrastrable (dnd-kit).

import { useDraggable } from '@dnd-kit/core'
import { User, Skull } from 'lucide-react'
import { colorForCharacter } from './palette.js'

// Visual puro (reutilizado en bandeja, tablero y DragOverlay).
export function TokenChip({ name, characters, size = 40, dimmed = false, highlight }) {
  const color = colorForCharacter(name, characters)
  const isVictim = name === characters.victim
  const dim = dimmed ? 0.45 : 1
  return (
    <div
      className="no-select flex flex-col items-center gap-0.5"
      style={{ opacity: dim }}
      title={name}
    >
      <div
        className="flex items-center justify-center rounded-lg shadow-md transition-transform"
        style={{
          width: size,
          height: size,
          background: color.bg,
          boxShadow: highlight
            ? `0 0 0 3px ${highlight}, 0 4px 10px rgba(0,0,0,0.45)`
            : `0 0 0 2px ${color.ring}55, 0 4px 10px rgba(0,0,0,0.4)`,
        }}
      >
        {isVictim ? (
          <Skull size={size * 0.5} color="#fff" />
        ) : (
          <User size={size * 0.5} color="#fff" />
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
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
        selected ? 'ring-2 ring-white/80' : ''
      }`}
      style={{ touchAction: 'none', cursor: 'grab', opacity: isDragging ? 0 : 1 }}
    >
      <TokenChip name={name} characters={characters} size={size} />
    </button>
  )
}
