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
    <div className="rounded-xl bg-ink-800/70 p-3 ring-1 ring-white/5">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Quote size={14} /> Pistas del caso
      </h3>
      <ul className="space-y-1.5">
        {groups.map((group) => {
          const color = colorForCharacter(group.subject, characters)
          const used = group.indices.every((i) => usedClues[i])
          return (
            <li key={group.subject}>
              <button
                onClick={() => group.indices.forEach((i) => onToggleClue(i))}
                className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5 ${
                  used ? 'opacity-50' : ''
                }`}
              >
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                  style={{ background: color.bg }}
                >
                  {used && <Check size={11} color="#fff" />}
                </span>
                <span className="text-sm leading-snug">
                  <span className="font-semibold" style={{ color: color.ring }}>
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
