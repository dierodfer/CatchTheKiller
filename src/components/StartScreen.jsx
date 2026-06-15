// Pantalla inicial: selección de dificultad y previsualización (estado IDLE).

import { motion, useReducedMotion } from 'framer-motion'
import { Loader2, Grid3x3, Users } from 'lucide-react'
import { DIFFICULTIES } from '@/game/constants.js'
import { ZONE_LIST } from './zones.js'
import MapPreview from './MapPreview.jsx'

export default function StartScreen({ difficulty, onSelect, onStart, generating, error }) {
  const diff = DIFFICULTIES[difficulty]
  const reduce = useReducedMotion()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-3xl text-center"
      >
        <img
          src="/logo.png"
          alt=""
          className="mx-auto mb-5 h-20 w-auto opacity-95 drop-shadow-[0_8px_24px_rgba(203,163,92,0.25)] sm:h-24"
        />
        <p className="eyebrow mb-2">Un caso de deducción</p>
        <h1 className="font-serif text-5xl font-semibold leading-none tracking-tight text-cream sm:text-6xl">
          Catch the Killer
        </h1>
        <p className="mx-auto mt-4 max-w-md font-serif text-xl italic leading-snug text-cream-soft">
          Reconstruye la escena con pura deducción espacial. El asesino emerge cuando cada
          presente ocupa su lugar.
        </p>

        {/* Las dos ambientaciones posibles del caso. */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-cream-dim">
          {ZONE_LIST.map((z) => (
            <span
              key={z.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-plum-900/50 px-3 py-1"
            >
              <z.icon size={13} style={{ color: z.accent }} />
              {z.label}
            </span>
          ))}
        </div>

        {/* Selector de dificultad. */}
        <div className="mt-8">
          <p className="eyebrow mb-3">Elige la dificultad</p>
          <div className="flex flex-wrap justify-center gap-2 rounded-2xl border border-gold/10 bg-plum-900/40 p-2 ring-botanica">
            {Object.values(DIFFICULTIES).map((d) => {
              const active = difficulty === d.id
              return (
                <button
                  key={d.id}
                  onClick={() => onSelect(d.id)}
                  aria-pressed={active}
                  className={`flex min-w-[7rem] flex-1 flex-col items-center gap-1 rounded-xl px-4 py-3 transition-colors ${
                    active
                      ? 'bg-gold/15 text-cream ring-1 ring-gold/45'
                      : 'text-cream-soft ring-1 ring-transparent hover:bg-plum-800/60'
                  }`}
                >
                  <span className="font-serif text-lg font-semibold leading-none">{d.label}</span>
                  <span className="flex items-center gap-2 text-[11px] text-cream-dim">
                    <span className="inline-flex items-center gap-0.5">
                      <Grid3x3 size={11} /> {d.gridSize}×{d.gridSize}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Users size={11} /> {d.numCharacters}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Previsualización del mapa de la dificultad seleccionada. */}
        <div className="mt-7">
          <p className="eyebrow mb-3">Así será el escenario · {diff.label}</p>
          <MapPreview key={diff.id} difficulty={diff} />
        </div>

        <motion.button
          onClick={() => onStart(difficulty)}
          disabled={generating}
          whileHover={reduce || generating ? undefined : { scale: 1.02 }}
          whileTap={reduce || generating ? undefined : { scale: 0.98 }}
          className="mt-9 inline-flex items-center justify-center gap-2 rounded-full bg-gold px-9 py-3.5 text-base font-semibold text-plum-950 shadow-[0_10px_30px_-8px_rgba(203,163,92,0.6)] transition enabled:hover:bg-gold-soft disabled:opacity-60"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Preparando el caso…
            </>
          ) : (
            'Empezar investigación'
          )}
        </motion.button>

        {error && <p className="mt-4 text-sm text-rose">Error: {error}</p>}
      </motion.div>
    </div>
  )
}
