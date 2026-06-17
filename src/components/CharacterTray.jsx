// Reparto del caso: personajes aún sin situar en la escena. También es la zona
// de "descolocado" (soltar aquí una ficha la retira del tablero). Muestra el
// progreso de cuántos personajes están ya situados.

import { useDroppable } from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Check } from 'lucide-react'
import { DraggableToken } from './CharacterToken.jsx'

export default function CharacterTray({ characters, placements, selectedToken, onTokenClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'tray' })
  // Sospechosos y víctima, en orden alfabético.
  const all = [...characters.suspects, characters.victim].sort((a, b) => a.localeCompare(b, 'es'))
  const unplaced = all.filter((name) => !placements[name])
  const placed = all.length - unplaced.length
  const done = unplaced.length === 0

  return (
    <div
      ref={setNodeRef}
      className="w-full rounded-2xl border border-gold/12 bg-cream-100/80 p-3 ring-botanica transition-colors"
      style={{ outline: isOver ? '2px dashed rgba(203,163,92,0.5)' : 'none', outlineOffset: -4 }}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="eyebrow flex items-center gap-1.5">
          <Users size={13} className="text-gold-deep" /> Reparto del caso
        </h3>
        <span className="shrink-0 text-[12px] font-medium tabular-nums text-plum-500">
          {placed} / {all.length} situados
        </span>
      </div>

      {/* Barra de progreso de colocación. */}
      <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-cream-300/70">
        <div
          className="h-full rounded-full bg-gold transition-all duration-500 ease-out"
          style={{ width: `${(placed / all.length) * 100}%` }}
        />
      </div>

      <div className="flex min-h-[60px] flex-wrap items-start gap-3">
        <AnimatePresence>
          {unplaced.map((name) => (
            <motion.div
              key={name}
              layoutId={`token-${name}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <DraggableToken
                name={name}
                characters={characters}
                size={44}
                selected={selectedToken === name}
                onClick={() => onTokenClick(name)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {done && (
          <p className="flex items-center gap-1.5 font-serif text-base italic text-sage-deep">
            <Check size={16} /> Todo el reparto está en la escena.
          </p>
        )}
      </div>
    </div>
  )
}
