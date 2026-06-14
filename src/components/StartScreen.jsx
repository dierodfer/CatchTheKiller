// Pantalla inicial: selección de dificultad y previsualización (estado IDLE).

import { motion } from 'framer-motion'
import { Skull, Loader2, Grid3x3, Users } from 'lucide-react'
import { DIFFICULTIES } from '@/game/constants.js'
import MapPreview from './MapPreview.jsx'

export default function StartScreen({ difficulty, onSelect, onStart, generating, error }) {
  const diff = DIFFICULTIES[difficulty]

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blood/20 ring-1 ring-blood/40">
          <Skull size={36} className="text-blood" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white">Catch the Killer</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-400">
          Reconstruye la escena del crimen con pura deducción espacial. El asesino emerge al
          colocar a cada personaje en su sitio.
        </p>

        {/* Selector de dificultad: barra horizontal. */}
        <div className="mt-8 flex flex-wrap justify-center gap-2 rounded-2xl bg-ink-800/40 p-2 ring-1 ring-white/5">
          {Object.values(DIFFICULTIES).map((d) => {
            const active = difficulty === d.id
            return (
              <button
                key={d.id}
                onClick={() => onSelect(d.id)}
                className={`flex min-w-[7.5rem] flex-1 flex-col items-center gap-0.5 rounded-xl px-4 py-2.5 transition ${
                  active
                    ? 'bg-blood/15 ring-1 ring-blood/50'
                    : 'ring-1 ring-transparent hover:bg-ink-700/60'
                }`}
              >
                <span className="text-sm font-bold text-white">{d.label}</span>
                <span className="flex items-center gap-2 text-[11px] text-slate-400">
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

        {/* Previsualización del mapa de la dificultad seleccionada. */}
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Así será el escenario · {diff.label}
          </p>
          <MapPreview key={diff.id} difficulty={diff} />
        </div>

        <button
          onClick={() => onStart(difficulty)}
          disabled={generating}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-blood px-8 py-3 text-base font-semibold text-white shadow-lg transition enabled:hover:brightness-110 disabled:opacity-60"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Generando caso…
            </>
          ) : (
            'Empezar investigación'
          )}
        </button>

        {error && <p className="mt-4 text-sm text-amber-300">Error: {error}</p>}
      </motion.div>
    </div>
  )
}
