// Controles de partida: resolver, ver la solución, nuevo puzzle.

import { Eye, Gavel, RotateCcw } from 'lucide-react'

export default function Toolbar({ allPlaced, onCheck, onReveal, onNewGame }) {
  return (
    <div className="rounded-2xl border border-gold/12 bg-plum-850/60 p-4 ring-botanica">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onCheck}
          disabled={!allPlaced}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-plum-950 shadow-[0_8px_22px_-8px_rgba(203,163,92,0.7)] transition enabled:hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Gavel size={16} /> Resolver
        </button>
        <button
          onClick={onReveal}
          className="flex items-center justify-center gap-2 rounded-full border border-gold/20 bg-plum-700/50 px-4 py-2.5 text-sm font-medium text-cream-soft transition hover:bg-plum-600/60 hover:text-cream"
        >
          <Eye size={16} /> Resolución
        </button>
        <button
          onClick={onNewGame}
          className="flex items-center justify-center gap-2 rounded-full border border-gold/20 bg-plum-700/50 px-4 py-2.5 text-sm font-medium text-cream-soft transition hover:bg-plum-600/60 hover:text-cream"
        >
          <RotateCcw size={16} /> Nuevo
        </button>
      </div>

      {!allPlaced && (
        <p className="mt-2.5 font-serif text-[15px] italic text-cream-dim">
          Coloca a todos los personajes para poder resolver.
        </p>
      )}
    </div>
  )
}
