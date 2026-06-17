// Controles de partida: resolver, ver la solución, nuevo puzzle, reglas.
// Encabeza una píldora de estado que guía al jugador (cuántos faltan por
// situar) o confirma que la escena está lista para resolverse.

import { BookOpen, CheckCircle2, Eye, Gavel, MapPin, RotateCcw } from 'lucide-react'

export default function Toolbar({
  allPlaced,
  placedCount = 0,
  totalCount = 0,
  onCheck,
  onReveal,
  onNewGame,
  onShowRules,
}) {
  const remaining = Math.max(totalCount - placedCount, 0)

  return (
    <div className="rounded-2xl border border-gold/12 bg-cream-100/80 p-4 ring-botanica">
      {/* Estado del caso: guía contextual según el progreso de colocación. */}
      <div
        className={`mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[13.5px] font-medium ${
          allPlaced ? 'bg-sage/20 text-sage-deep' : 'bg-cream-200/70 text-plum-700'
        }`}
      >
        {allPlaced ? (
          <>
            <CheckCircle2 size={16} className="shrink-0" />
            <span>Escena completa. Dicta tu veredicto.</span>
          </>
        ) : (
          <>
            <MapPin size={16} className="shrink-0 text-gold-deep" />
            <span>
              {remaining === 1
                ? 'Falta 1 personaje por situar en la escena.'
                : `Faltan ${remaining} personajes por situar en la escena.`}
            </span>
          </>
        )}
      </div>

      {/* Acción principal. */}
      <button
        onClick={onCheck}
        disabled={!allPlaced}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-4 py-3 text-sm font-semibold text-plum-950 shadow-[0_8px_22px_-8px_rgba(203,163,92,0.7)] transition enabled:hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Gavel size={16} /> Resolver el caso
      </button>

      {/* Acciones secundarias. */}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={onReveal}
          className="flex flex-1 basis-24 items-center justify-center gap-1.5 rounded-full border border-gold/20 bg-cream-200/70 px-3 py-2 text-[13px] font-medium text-plum-800 transition hover:bg-cream-300/70 hover:text-plum-900"
        >
          <Eye size={15} /> Resolución
        </button>
        <button
          onClick={onNewGame}
          className="flex flex-1 basis-24 items-center justify-center gap-1.5 rounded-full border border-gold/20 bg-cream-200/70 px-3 py-2 text-[13px] font-medium text-plum-800 transition hover:bg-cream-300/70 hover:text-plum-900"
        >
          <RotateCcw size={15} /> Nuevo
        </button>
        <button
          onClick={onShowRules}
          className="flex flex-1 basis-24 items-center justify-center gap-1.5 rounded-full border border-gold/20 bg-cream-200/70 px-3 py-2 text-[13px] font-medium text-plum-800 transition hover:bg-cream-300/70 hover:text-plum-900"
        >
          <BookOpen size={15} /> Reglas
        </button>
      </div>
    </div>
  )
}
