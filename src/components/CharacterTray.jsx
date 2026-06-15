// Panel de personajes sin colocar (sección 9). Es zona de "descolocado".

import { useDroppable } from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import { DraggableToken } from './CharacterToken.jsx'

export default function CharacterTray({ characters, placements, selectedToken, onTokenClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'tray' })
  // Sospechosos y víctima, en orden alfabético.
  const all = [...characters.suspects, characters.victim].sort((a, b) => a.localeCompare(b, 'es'))
  const unplaced = all.filter((name) => !placements[name])

  return (
    <div
      ref={setNodeRef}
      className="rounded-2xl border border-gold/12 bg-cream-100/80 p-3 ring-botanica transition-colors"
      style={{ outline: isOver ? '2px dashed rgba(203,163,92,0.5)' : 'none', outlineOffset: -4 }}
    >
      <h3 className="eyebrow mb-2.5">Personajes ({unplaced.length})</h3>
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
        {unplaced.length === 0 && (
          <p className="font-serif text-base italic text-plum-600">
            Todos los personajes están en la escena.
          </p>
        )}
      </div>
    </div>
  )
}
