// Controles de partida: resolver, ver la solución, nuevo puzzle.

import { Eye, Gavel, RotateCcw } from 'lucide-react'

export default function Toolbar({ allPlaced, onCheck, onReveal, onNewGame }) {
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
    </div>
  )
}
