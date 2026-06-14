// Panel de personajes sin colocar (sección 9). Es zona de "descolocado".

import { useDroppable } from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import { DraggableToken } from './CharacterToken.jsx'

export default function CharacterTray({ characters, placements, selectedToken, onTokenClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'tray' })
  const all = [...characters.suspects, characters.victim]
  const unplaced = all.filter((name) => !placements[name])

  return (
    <div
      ref={setNodeRef}
      className="rounded-xl bg-ink-800/70 p-3 ring-1 ring-white/5 transition-colors"
      style={{ outline: isOver ? '2px dashed rgba(255,255,255,0.4)' : 'none', outlineOffset: -4 }}
    >
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Personajes ({unplaced.length})
      </h3>
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
          <p className="text-sm text-slate-500">Todos los personajes están en el tablero.</p>
        )}
      </div>
    </div>
  )
}
