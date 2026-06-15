// Panel de pistas (sección 9): una pista por sospechoso (varios datos pueden
// combinarse en una sola tarjeta), marcable como usada.

import { Quote, Check } from 'lucide-react'
import { colorForCharacter } from './palette.js'

export default function CluePanel({ puzzle, usedClues, onToggleClue }) {
  const { clues, characters } = puzzle

  // Agrupa todas las pistas de un mismo sospechoso en una única tarjeta.
  const groups = []
  const bySubject = {}
  clues.forEach((clue, i) => {
    let group = bySubject[clue.subject]
    if (!group) {
      group = { subject: clue.subject, indices: [], texts: [] }
      bySubject[clue.subject] = group
      groups.push(group)
    }
    group.indices.push(i)
    group.texts.push(clue.text)
  })

  return (
    <div className="rounded-2xl border border-gold/12 bg-cream-100/80 p-4 ring-botanica">
      <h3 className="mb-3 flex items-center gap-2 font-serif text-xl font-semibold text-plum-900">
        <Quote size={16} className="text-gold-deep" /> Pistas del caso
      </h3>
      <ul className="space-y-1">
        {groups.map((group) => {
          const color = colorForCharacter(group.subject, characters)
          const used = group.indices.every((i) => usedClues[i])
          return (
            <li key={group.subject}>
              <button
                onClick={() => group.indices.forEach((i) => onToggleClue(i))}
                aria-pressed={used}
                className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-cream-200/60 ${
                  used ? 'opacity-45' : ''
                }`}
              >
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ring-2 ring-inset ring-plum-950/30"
                  style={{ background: color.bg }}
                >
                  {used && <Check size={11} color="#160d18" strokeWidth={3} />}
                </span>
                <span className="text-[15px] leading-snug text-plum-800">
                  <span className="font-semibold" style={{ color: color.bg }}>
                    {group.subject}:
                  </span>{' '}
                  <span className={used ? 'line-through' : ''}>«{group.texts.join('. ')}»</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
