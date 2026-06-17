// Tablero de evidencias (sección 9): cada sospechoso aporta su testimonio,
// presentado como una ficha de expediente fijada con chincheta a un corcho.
// Si un personaje tiene varias pistas, todas se agrupan en su misma ficha.
// Tocar una ficha la "descarta" (sello DESCARTADO) — ayuda de anotación para
// el jugador; no altera la lógica del caso.

import { useMemo, useState } from 'react'
import { Skull } from 'lucide-react'
import { colorForCharacter } from './palette.js'
import { PixelAvatar } from './pixelArt.jsx'

// Inclinaciones "al azar" pero estables entre renders (deterministas por
// índice), para el efecto de papeles fijados a mano de forma irregular.
const noteTilt = (i) => ((i * 47) % 9) - 4 // -4°..4°
const photoTilt = (i) => ((i * 31 + 5) % 7) - 3 // -3°..3°

// Moteado tenue de corcho para el fondo del tablero (sobre el crema base).
const CORK_TEXTURE = {
  backgroundImage:
    'radial-gradient(circle at 18% 24%, rgba(160,125,60,0.06) 0 1.5px, transparent 2px),' +
    'radial-gradient(circle at 68% 58%, rgba(160,125,60,0.05) 0 1.5px, transparent 2px),' +
    'radial-gradient(circle at 42% 86%, rgba(120,82,40,0.045) 0 1.5px, transparent 2px)',
  backgroundSize: '23px 23px, 31px 31px, 19px 19px',
}

// Chincheta con brillo (cabeza redonda + reflejo). Dorada para sospechosos,
// rosa para la víctima, para reforzar su distinción.
function Pushpin({ victim = false, size = 14 }) {
  const head = victim
    ? 'radial-gradient(circle at 35% 30%, #e9bcc0, #b97a80 48%, #8f5258 100%)'
    : 'radial-gradient(circle at 35% 30%, #f1dca6, #cba35c 46%, #a07d3c 100%)'
  return (
    <span
      aria-hidden
      className="block rounded-full"
      style={{
        width: size,
        height: size,
        background: head,
        boxShadow: '0 2px 3px rgba(30,19,34,0.45), inset 0 -1px 1px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.5)',
      }}
    />
  )
}

// Agrupa las pistas por sujeto conservando el orden de aparición.
function groupBySubject(clues) {
  const order = []
  const bySubject = new Map()
  for (const clue of clues) {
    if (!bySubject.has(clue.subject)) {
      bySubject.set(clue.subject, [])
      order.push(clue.subject)
    }
    bySubject.get(clue.subject).push(clue.text)
  }
  return order.map((subject) => ({ subject, texts: bySubject.get(subject) }))
}

export default function CluePanel({ puzzle }) {
  const { clues, characters } = puzzle
  const groups = useMemo(() => groupBySubject(clues), [clues])
  const [struck, setStruck] = useState(new Set())

  const toggleStruck = (subject) =>
    setStruck((prev) => {
      const next = new Set(prev)
      next.has(subject) ? next.delete(subject) : next.add(subject)
      return next
    })

  return (
    <div
      className="rounded-2xl border border-gold/12 bg-cream-100/80 p-4 ring-botanica"
      style={CORK_TEXTURE}
    >
      <div className="mb-1 flex items-start justify-between">
        <div>
          <p className="eyebrow">Expediente del caso</p>
          <h3 className="font-serif text-xl font-semibold leading-tight text-plum-900">
            Tablero de evidencias
          </h3>
        </div>
        <Pushpin size={15} />
      </div>
      <p className="mb-4 font-serif text-[13px] italic text-plum-500">
        Toca una ficha para descartar a un sospechoso.
      </p>

      <ul className="flex flex-col gap-4">
        {groups.map(({ subject, texts }, i) => {
          const color = colorForCharacter(subject, characters)
          const isVictim = subject === characters.victim
          const isStruck = struck.has(subject)
          return (
            <li key={subject} className="flex justify-center">
              <div
                role="button"
                tabIndex={0}
                aria-pressed={isStruck}
                aria-label={`${subject}${isVictim ? ' (víctima)' : ''}. ${isStruck ? 'Descartado' : 'Toca para descartar'}.`}
                onClick={() => toggleStruck(subject)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleStruck(subject)
                  }
                }}
                className={`relative flex w-full max-w-md cursor-pointer select-none items-center gap-3 rounded-[4px] border border-plum-950/10 bg-cream-50 py-3 pl-3 pr-3.5 shadow-[0_5px_14px_-6px_rgba(30,19,34,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_9px_20px_-7px_rgba(30,19,34,0.5)] ${
                  isStruck ? 'opacity-45 saturate-[0.35]' : ''
                }`}
                style={{ transform: `rotate(${noteTilt(i)}deg)` }}
              >
                {/* Chincheta que sujeta la ficha. */}
                <span className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <Pushpin victim={isVictim} />
                </span>

                {/* Retrato como foto polaroid fijada a la izquierda. */}
                <div
                  className="shrink-0 rounded-[3px] border border-plum-950/10 bg-cream-50 p-1 pb-2 shadow-[0_2px_6px_-2px_rgba(30,19,34,0.5)]"
                  style={{ transform: `rotate(${photoTilt(i)}deg)` }}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[2px] bg-gradient-to-br from-cream-200 to-cream-300">
                    <PixelAvatar color={color.bg} isVictim={isVictim} size={30} />
                  </div>
                </div>

                {/* Identidad + testimonios. */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="truncate font-serif text-[17px] font-semibold leading-none" style={{ color: color.bg }}>
                      {subject}
                    </span>
                    {isVictim && (
                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-plum-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream-50">
                        <Skull size={9} /> Víctima
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {texts.map((text, j) => (
                      <p key={j} className="font-serif text-[15px] italic leading-snug text-plum-700">
                        <span className="mr-0.5 align-[-0.15em] text-base not-italic text-gold-deep">“</span>
                        {text}
                        <span className="ml-0.5 align-[-0.15em] text-base not-italic text-gold-deep">”</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* Sello de descartado. */}
                {isStruck && (
                  <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 select-none whitespace-nowrap rounded-[3px] border-2 border-rose-deep/70 px-2.5 py-0.5 text-[12px] font-bold uppercase tracking-[0.18em] text-rose-deep">
                    Descartado
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
