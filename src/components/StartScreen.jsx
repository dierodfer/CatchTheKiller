// Pantalla inicial: selección de dificultad y previsualización (estado IDLE).

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Loader2, Skull } from 'lucide-react'
import { DIFFICULTIES } from '@/game/constants.js'
import { SUSPECT_COLORS } from './palette.js'
import { PixelAvatar } from './pixelArt.jsx'
import { ZONE_LIST } from './zones.js'
import MapPreview from './MapPreview.jsx'

const LEVELS = Object.values(DIFFICULTIES)

export default function StartScreen({ difficulty, onSelect, onStart, generating, error }) {
  const diff = DIFFICULTIES[difficulty]
  const levelIndex = LEVELS.findIndex((d) => d.id === difficulty)
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
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt=""
          className="mx-auto mb-5 h-20 w-auto opacity-95 drop-shadow-[0_8px_24px_rgba(203,163,92,0.25)] sm:h-24"
        />
        <p className="eyebrow mb-2">Un caso de deducción</p>
        <h1 className="font-serif text-5xl font-semibold leading-none tracking-tight text-plum-900 sm:text-6xl">
          Catch the Killer
        </h1>
        <p className="mx-auto mt-4 max-w-md font-serif text-xl italic leading-snug text-plum-800">
          Reconstruye la escena con pura deducción espacial. El asesino emerge cuando cada
          presente ocupa su lugar.
        </p>

        {/* Las dos ambientaciones posibles del caso. */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-plum-600">
          {ZONE_LIST.map((z) => (
            <span
              key={z.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-cream-100/70 px-3 py-1"
            >
              <z.icon size={13} style={{ color: z.accent }} />
              {z.label}
            </span>
          ))}
        </div>

        {/* Selector de dificultad: control deslizante continuo de Fácil a Experto. */}
        <div className="mt-8">
          <p className="eyebrow mb-3">Elige la dificultad</p>
          <div className="rounded-2xl border border-gold/10 bg-cream-100/60 p-6 ring-botanica sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-serif text-3xl font-semibold leading-none text-plum-900 sm:text-4xl">
                {diff.label}
              </span>
              <span className="text-sm font-medium text-plum-600">
                {diff.numCharacters - 1} posibles asesinos · 1 muerto
              </span>
            </div>

            {/* Sospechosos: crecen en número según el nivel elegido. */}
            <div className="my-4 flex min-h-[36px] flex-wrap items-center gap-2">
              <AnimatePresence initial={false}>
                {Array.from({ length: diff.numCharacters - 1 }, (_, i) => (
                  <motion.div
                    key={i}
                    initial={reduce ? false : { opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduce ? undefined : { opacity: 0, scale: 0.4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PixelAvatar color={SUSPECT_COLORS[i % SUSPECT_COLORS.length].bg} size={34} />
                  </motion.div>
                ))}
              </AnimatePresence>
              <div className="mx-1.5 h-8 w-px shrink-0 bg-gold/20" aria-hidden />
              <div className="flex items-center gap-1.5 text-plum-500">
                <PixelAvatar isVictim size={34} />
                <Skull size={16} />
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={LEVELS.length - 1}
              step={1}
              value={levelIndex}
              onChange={(e) => onSelect(LEVELS[Number(e.target.value)].id)}
              className="h-3 w-full cursor-pointer appearance-none rounded-full bg-cream-300 accent-gold-deep [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full"
              aria-label="Dificultad"
            />
            <div className="mt-2 flex justify-between text-sm font-medium text-plum-600">
              {LEVELS.map((d) => (
                <span key={d.id} className={d.id === difficulty ? 'text-plum-900' : undefined}>
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Previsualización del mapa de la dificultad seleccionada. */}
        <div className="mt-7">
          <p className="eyebrow mb-3">Así será el escenario</p>
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

        {error && <p className="mt-4 text-sm text-rose-deep">Error: {error}</p>}
      </motion.div>
    </div>
  )
}
