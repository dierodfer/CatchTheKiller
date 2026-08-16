import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Loader2, Skull, Ticket } from 'lucide-react'
import { DIFFICULTIES } from '@/game/constants.js'
import { SUSPECT_COLORS } from './palette.js'
import { PixelAvatar, PixelLupa } from './pixelArt.jsx'
import { ZONE_LIST } from './zones.js'
import MapPreview from './MapPreview.jsx'

const LEVELS = Object.values(DIFFICULTIES)

// Las pistas adicionales de un nivel, con la MISMA lupa que las representa en
// el expediente (ver CluePanel): quien ve dos lupas aquí sabe exactamente qué
// va a poder pedir durante el caso.
function LupaCount({ count, size = 13 }) {
  return (
    <span
      className="flex items-center gap-0.5"
      // Una sola etiqueta para el grupo: leer "lupa" N veces no aporta nada.
      role="img"
      aria-label={`${count} pistas adicionales`}
    >
      {Array.from({ length: count }, (_, i) => (
        <PixelLupa key={i} size={size} />
      ))}
    </span>
  )
}

export default function StartScreen({
  difficulty,
  onSelect,
  onStart,
  generating,
  error,
  irregular,
  onToggleIrregular,
  onLoadCode,
}) {
  const diff = DIFFICULTIES[difficulty]
  const levelIndex = LEVELS.findIndex((d) => d.id === difficulty)
  const reduce = useReducedMotion()
  const [shareCode, setShareCode] = useState('')

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
                    {diff.numCharacters - 1} posibles asesinos · 1 muerto ·{' '}
                    {diff.gridSize}×{diff.gridSize}
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

                {/* Los ajustes se bloquean mientras se genera: el caso en curso
                    ya salió con los valores de antes, y tocarlos daría a
                    entender que aún lo cambian. */}
                <input
                  type="range"
                  min={0}
                  max={LEVELS.length - 1}
                  step={1}
                  value={levelIndex}
                  disabled={generating}
                  onChange={(e) => onSelect(LEVELS[Number(e.target.value)].id)}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-cream-300 accent-gold-deep disabled:cursor-not-allowed"
                  aria-label="Dificultad"
                />

                {/* Seis rangos ya no caben en una fila de etiquetas bajo el
                    deslizador, así que cada uno tiene su propia pastilla — y
                    ahí es donde se ven las lupas que reparte el nivel. */}
                <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                  {LEVELS.map((lvl, i) => (
                    <button
                      type="button"
                      key={lvl.id}
                      onClick={() => onSelect(lvl.id)}
                      disabled={generating}
                      className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-1.5 transition-colors ${
                        i === levelIndex
                          ? 'border-gold/45 bg-gold/12 text-gold-deep'
                          : 'border-gold/10 bg-cream-100/50 text-plum-500 enabled:hover:border-gold/25 enabled:hover:text-plum-700'
                      }`}
                      aria-pressed={i === levelIndex}
                    >
                      <span
                        className={`text-[11px] leading-none ${
                          i === levelIndex ? 'font-semibold' : 'font-medium'
                        }`}
                      >
                        {lvl.label}
                      </span>
                      <LupaCount count={lvl.extraClues} />
                    </button>
                  ))}
                </div>

                <p className="mt-2 text-center text-[11px] leading-snug text-plum-500">
                  Cada <PixelLupa size={12} className="inline-block align-[-0.15em]" /> es una pista
                  adicional que podrás pedir durante el caso.
                </p>

                {/* No es un <label>: el control es un botón con role="switch",
                    que no es un elemento etiquetable (lleva su propio
                    aria-label). */}
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gold/15 bg-cream-100/70 px-3.5 py-2.5">
                  <span className="text-left">
                    <span className="block text-[13px] font-semibold text-plum-800">
                      Mapa irregular
                    </span>
                    <span className="block text-[11px] text-plum-500">
                      Esquinas recortadas, patios y huecos en el tablero
                    </span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!irregular}
                    aria-label="Mapa irregular"
                    disabled={generating}
                    onClick={() => onToggleIrregular(!irregular)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed ${
                      irregular ? 'bg-gold-deep' : 'bg-cream-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        irregular ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-center sm:shrink-0">
                <MapPreview
                  key={`${diff.id}${irregular ? '-i' : ''}`}
                  difficulty={diff}
                  irregular={irregular}
                />
              </div>
            </div>
          </div>
        </div>

        <motion.button
          onClick={() => onStart(difficulty)}
          disabled={generating}
          aria-busy={generating}
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

        {/* Partida compartida: pegar un código reconstruye el caso exacto. */}
        <form
          className="mt-5 flex w-full max-w-md items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (shareCode.trim()) onLoadCode(shareCode)
          }}
        >
          <div className="relative flex-1">
            <Ticket
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-plum-400"
            />
            <input
              type="text"
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value)}
              placeholder="¿Tienes un código de caso?"
              aria-label="Código de caso compartido"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="w-full rounded-full border border-gold/20 bg-cream-100/70 py-2.5 pl-9 pr-3 text-center font-pixel text-[15px] tracking-wider text-plum-900 placeholder:font-sans placeholder:text-[13px] placeholder:tracking-normal placeholder:text-plum-500 focus:border-gold/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!shareCode.trim() || generating}
            className="shrink-0 rounded-full border border-gold/20 bg-cream-200/70 px-4 py-2.5 text-[13px] font-semibold text-plum-800 transition enabled:hover:bg-cream-300/70 disabled:opacity-40"
          >
            Cargar caso
          </button>
        </form>

        {/* `role="alert"` y no `aria-live` a secas: el párrafo se inserta en el
            momento del fallo, y solo una región assertive se anuncia al
            aparecer de nuevas. */}
        {error && (
          <p role="alert" className="mt-4 text-sm text-rose-deep">
            Error: {error}
          </p>
        )}
      </motion.div>
    </div>
  )
}
