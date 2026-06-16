// Controles de partida: resolver, ver la solución, nuevo puzzle.

import { BookOpen, Eye, Gavel, RotateCcw } from 'lucide-react'

export default function Toolbar({ allPlaced, onCheck, onReveal, onNewGame, onShowRules }) {
  return (
    <div className="rounded-2xl border border-gold/12 bg-cream-100/80 p-4 ring-botanica">
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
          className="flex items-center justify-center gap-2 rounded-full border border-gold/20 bg-cream-200/70 px-4 py-2.5 text-sm font-medium text-plum-800 transition hover:bg-cream-300/70 hover:text-plum-900"
        >
          <Eye size={16} /> Resolución
        </button>
        <button
          onClick={onNewGame}
          className="flex items-center justify-center gap-2 rounded-full border border-gold/20 bg-cream-200/70 px-4 py-2.5 text-sm font-medium text-plum-800 transition hover:bg-cream-300/70 hover:text-plum-900"
        >
          <RotateCcw size={16} /> Nuevo
        </button>
        <button
          onClick={onShowRules}
          className="flex items-center justify-center gap-2 rounded-full border border-gold/20 bg-cream-200/70 px-4 py-2.5 text-sm font-medium text-plum-800 transition hover:bg-cream-300/70 hover:text-plum-900"
        >
          <BookOpen size={16} /> Reglas
        </button>
      </div>

      {!allPlaced && (
        <p className="mt-2.5 font-serif text-[15px] italic text-plum-600">
          Coloca a todos los personajes para poder resolver.
        </p>
      )}
    </div>
  )
}
