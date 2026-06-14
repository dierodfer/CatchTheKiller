// Controles de partida: resolver, pedir ayuda, nuevo puzzle.

import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Gavel, Lightbulb, RotateCcw, X } from 'lucide-react'

export default function Toolbar({
  allPlaced,
  hintsUsed,
  hint,
  onCheck,
  onHint,
  onDismissHint,
  onReveal,
  onNewGame,
}) {
  return (
    <div className="rounded-xl bg-ink-800/70 p-3 ring-1 ring-white/5">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onCheck}
          disabled={!allPlaced}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blood px-3 py-2 text-sm font-semibold text-white shadow transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Gavel size={16} /> Resolver
        </button>
        <button
          onClick={onHint}
          className="flex items-center justify-center gap-2 rounded-lg bg-ink-600 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-ink-500"
        >
          <Lightbulb size={16} /> Ayuda{hintsUsed > 0 ? ` (${hintsUsed})` : ''}
        </button>
        <button
          onClick={onReveal}
          className="flex items-center justify-center gap-2 rounded-lg bg-ink-600 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-ink-500"
        >
          <Eye size={16} /> Resolución
        </button>
        <button
          onClick={onNewGame}
          className="flex items-center justify-center gap-2 rounded-lg bg-ink-600 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-ink-500"
        >
          <RotateCcw size={16} /> Nuevo
        </button>
      </div>

      {!allPlaced && (
        <p className="mt-2 text-xs text-slate-500">
          Coloca a todos los personajes para poder resolver.
        </p>
      )}

      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden"
          >
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-200 ring-1 ring-amber-400/30">
              <Lightbulb size={16} className="mt-0.5 shrink-0" />
              <span className="flex-1">{hint.text}</span>
              <button onClick={onDismissHint} className="text-amber-300/70 hover:text-amber-200">
                <X size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
