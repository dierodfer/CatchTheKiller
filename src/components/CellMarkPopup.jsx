// Popup de marcado de casilla: permite al jugador anotar qué personajes
// podrían estar en una posición concreta del tablero.

import { useEffect, useRef } from 'react'
import { colorForCharacter } from './palette.js'

export default function CellMarkPopup({
  r,
  c,
  characters,
  marks,
  occupantName,
  onToggle,
  onRemove,
  onClose,
  cellSize,
}) {
  const ref = useRef(null)
  const allNames = [...characters.suspects, characters.victim]

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('pointerdown', handler, true)
    return () => document.removeEventListener('pointerdown', handler, true)
  }, [onClose])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const currentMarks = marks[`${r},${c}`] || []
  const cols = allNames.length <= 4 ? 2 : 3

  return (
    <div
      ref={ref}
      className="absolute z-50 rounded-lg border border-gold/20 bg-cream-50 p-2 shadow-xl"
      style={{
        minWidth: Math.max(cellSize * 1.5, 120),
        transform: 'translate(-25%, -25%)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {allNames.map((name) => {
          const color = colorForCharacter(name, characters)
          const active = currentMarks.includes(name)
          const initial = name[0].toUpperCase()
          return (
            <button
              key={name}
              onClick={(e) => {
                e.stopPropagation()
                onToggle(r, c, name)
                onClose()
              }}
              title={name}
              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium transition-all hover:scale-105"
              style={{
                background: active ? color.bg : 'transparent',
                color: active ? '#fff' : '#5a4a5e',
                border: `2px solid ${active ? color.ring : 'rgba(90,74,94,0.2)'}`,
                textShadow: active ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <span
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  background: active ? 'rgba(255,255,255,0.3)' : color.bg + '44',
                  color: active ? '#fff' : color.bg,
                }}
              >
                {initial}
              </span>
              <span className="truncate">{name}</span>
            </button>
          )
        })}
      </div>

      {/* Quitar la ficha colocada (a ancho completo, bajo los personajes). */}
      {occupantName && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(occupantName)
            onClose()
          }}
          className="mt-1.5 w-full rounded-md px-2 py-1.5 text-[11px] font-semibold transition-all hover:brightness-95"
          style={{
            background: '#f3dada',
            color: '#9a3a3a',
            border: '2px solid #e0b0b0',
          }}
        >
          Quitar a {occupantName}
        </button>
      )}
    </div>
  )
}
