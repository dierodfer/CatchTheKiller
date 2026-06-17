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
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-full max-w-2xl flex-col items-center text-center"
      >
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt=""
          className="mb-3 h-14 w-auto opacity-95 drop-shadow-[0_8px_24px_rgba(203,163,92,0.25)]"
        />
        <p className="eyebrow mb-1">Un caso de deducción</p>
        <h1 className="font-serif text-5xl font-semibold leading-[0.95] tracking-tight text-plum-900 sm:text-6xl">
          Catch the Killer
        </h1>
        <p className="mt-3 max-w-md font-serif text-lg italic leading-snug text-plum-800">
          Reconstruye la escena con pura deducción espacial. El asesino emerge
          cuando cada presente ocupa su lugar.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-plum-600">
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

        <div className="mt-6 w-full">
          <div className="rounded-2xl border border-gold/10 bg-cream-100/60 p-5 ring-botanica">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-serif text-2xl font-semibold leading-none text-plum-900">
                    {diff.label}
                  </span>
                  <span className="text-[11px] font-medium text-plum-600">
                    {diff.numCharacters - 1} posibles asesinos · 1 muerto
                  </span>
                </div>

                <div className="my-3 flex min-h-[28px] flex-wrap items-center gap-1.5">
                  <AnimatePresence initial={false}>
                    {Array.from({ length: diff.numCharacters - 1 }, (_, i) => (
                      <motion.div
                        key={i}
                        initial={reduce ? false : { opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduce ? undefined : { opacity: 0, scale: 0.4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <PixelAvatar color={SUSPECT_COLORS[i % SUSPECT_COLORS.length].bg} size={26} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div className="mx-1 h-6 w-px shrink-0 bg-gold/20" aria-hidden />
                  <div className="flex items-center gap-1 text-plum-500">
                    <PixelAvatar isVictim size={26} />
                    <Skull size={13} />
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={LEVELS.length - 1}
                  step={1}
                  value={levelIndex}
                  onChange={(e) => onSelect(LEVELS[Number(e.target.value)].id)}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-cream-300 accent-gold-deep"
                  aria-label="Dificultad"
                />

                <div className="mt-2.5 flex justify-between">
                  {LEVELS.map((lvl, i) => (
                    <button
                      key={lvl.id}
                      onClick={() => onSelect(lvl.id)}
                      className={`-mx-1 px-1 text-[11px] transition-colors ${
                        i === levelIndex
                          ? 'font-semibold text-gold-deep'
                          : 'font-medium text-plum-500 hover:text-plum-700'
                      }`}
                      aria-pressed={i === levelIndex}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center sm:shrink-0">
                <MapPreview key={diff.id} difficulty={diff} />
              </div>
            </div>
          </div>
        </div>

        <motion.button
          onClick={() => onStart(difficulty)}
          disabled={generating}
          whileHover={reduce || generating ? undefined : { scale: 1.02 }}
          whileTap={reduce || generating ? undefined : { scale: 0.98 }}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-9 py-3.5 text-base font-semibold text-plum-950 shadow-[0_10px_30px_-8px_rgba(203,163,92,0.6)] transition enabled:hover:bg-gold-soft disabled:opacity-60"
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
