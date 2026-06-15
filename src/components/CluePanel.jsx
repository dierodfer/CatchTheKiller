// Panel de pistas (sección 9): notas fijadas al corcho, una por sospechoso,
// con su retrato a la izquierda. Si un personaje tiene varias pistas, todas
// se agrupan en la misma nota (no se reparten en notas distintas). Es una
// vista estática de consulta (no se marcan como "usadas").

import { Pin, Quote, Skull } from 'lucide-react'
import { colorForCharacter } from './palette.js'
import { PixelAvatar } from './pixelArt.jsx'

// Pequeñas inclinaciones "al azar" pero estables entre renders (deterministas
// por índice), para el efecto de notas de papel fijadas de forma irregular.
const noteTilt = (i) => ((i * 47) % 9) - 4 // -4°..4°
const photoTilt = (i) => ((i * 31 + 5) % 11) - 5 // -5°..5°

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
  const groups = groupBySubject(clues)

  return (
    <div className="rounded-2xl border border-gold/12 bg-cream-100/80 p-4 ring-botanica">
      <h3 className="mb-4 flex items-center gap-2 font-serif text-xl font-semibold text-plum-900">
        <Quote size={16} className="text-gold-deep" /> Pistas del caso
      </h3>
      <ul className="flex flex-col gap-3.5">
        {groups.map(({ subject, texts }, i) => {
          const color = colorForCharacter(subject, characters)
          const isVictim = subject === characters.victim
          return (
            <li
              key={subject}
              className="relative mx-auto flex w-full max-w-md items-center gap-3 rounded-sm bg-cream-50 py-2.5 pl-2.5 pr-3 shadow-[0_4px_12px_-5px_rgba(30,19,34,0.4)] ring-1 ring-plum-950/5"
              style={{ transform: `rotate(${noteTilt(i)}deg)` }}
            >
              {/* "Pin" que sujeta la nota. */}
              <Pin
                size={12}
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 -rotate-45 text-gold-deep/70"
                fill="currentColor"
              />
              {/* Retrato del sospechoso, como una foto fijada a la izquierda. */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-2 border-cream-50 bg-cream-200 shadow-[0_2px_6px_-2px_rgba(30,19,34,0.45)] ring-1 ring-plum-950/10"
                style={{ transform: `rotate(${photoTilt(i)}deg)` }}
              >
                <PixelAvatar color={color.bg} isVictim={isVictim} size={28} />
              </div>
              <div className="text-[15px] leading-snug text-plum-800">
                <span className="font-semibold" style={{ color: color.bg }}>
                  {subject}
                </span>
                {isVictim && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-plum-900 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-cream-50">
                    <Skull size={9} /> Víctima
                  </span>
                )}
                <span className="text-plum-500">:</span>{' '}
                {texts.map((text, j) => (
                  <span key={j}>
                    {j > 0 && <span className="text-plum-500"> · </span>}«{text}»
                  </span>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
