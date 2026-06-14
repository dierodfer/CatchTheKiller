// Pantalla inicial: selección de dificultad (estado IDLE).

import { motion } from 'framer-motion'
import { Skull, Loader2 } from 'lucide-react'
import { DIFFICULTIES } from '../game/constants.js'

export default function StartScreen({ difficulty, onSelect, onStart, generating, error }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blood/20 ring-1 ring-blood/40">
          <Skull size={36} className="text-blood" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white">Catch the Killer</h1>
        <p className="mt-2 text-slate-400">
          Reconstruye la escena del crimen con pura deducción espacial. El asesino emerge al
          colocar a cada personaje en su sitio.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {Object.values(DIFFICULTIES).map((d) => {
            const active = difficulty === d.id
            return (
              <button
                key={d.id}
                onClick={() => onSelect(d.id)}
                className={`rounded-xl p-4 text-left ring-1 transition ${
                  active
                    ? 'bg-blood/15 ring-blood/50'
                    : 'bg-ink-800/70 ring-white/5 hover:bg-ink-700/70'
                }`}
              >
                <div className="text-lg font-bold text-white">{d.label}</div>
                <div className="text-xs text-slate-400">
                  {d.gridSize}×{d.gridSize} · {d.numCharacters} personajes
                </div>
              </button>
            )
          })}
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
