// Panel de pistas (sección 9): una entrada por pista, marcable como usada.

import { Quote, Check } from 'lucide-react'
import { colorForCharacter } from './palette.js'

export default function CluePanel({ puzzle, usedClues, onToggleClue }) {
  const { clues, characters } = puzzle

  return (
    <div className="rounded-xl bg-ink-800/70 p-3 ring-1 ring-white/5">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Quote size={14} /> Pistas de los sospechosos
      </h3>
      <ul className="space-y-1.5">
        {clues.map((clue, i) => {
          const color = colorForCharacter(clue.subject, characters)
          const used = !!usedClues[i]
          return (
            <li key={i}>
              <button
                onClick={() => onToggleClue(i)}
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
                    {clue.subject}:
                  </span>{' '}
                  <span className={used ? 'line-through' : ''}>«{clue.text}»</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
