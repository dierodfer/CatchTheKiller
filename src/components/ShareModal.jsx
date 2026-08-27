// Modal de compartir partida: muestra el código alfanumérico del caso y un
// enlace directo, con opción de incluir las fichas ya colocadas. El receptor
// reconstruye el caso exacto (la generación es determinista por seed).

import { useMemo, useRef, useState } from 'react'
import { Check, Copy, Link2, Share2, X } from 'lucide-react'
import { encodeShareCode, placementsToIndices } from '@/game/shareCode.js'
import ModalShell from './ModalShell.jsx'

// Copia con la Clipboard API. Si falla (contexto sin permiso), no hay plan B:
// el código sigue visible y seleccionable en el propio modal, así que el
// jugador puede copiarlo a mano.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export default function ShareModal({ open, onClose, puzzle, placements }) {
  const [includePlacements, setIncludePlacements] = useState(false)
  const [copied, setCopied] = useState(null) // 'code' | 'link' | null
  const copyTimer = useRef(null)

  const placedCount = Object.keys(placements || {}).length

  const code = useMemo(() => {
    if (!open) return ''
    return encodeShareCode({
      difficultyId: puzzle.difficulty,
      seed: puzzle.seed,
      irregular: !!puzzle.irregular,
      placementIndices:
        includePlacements && placedCount > 0
          ? placementsToIndices(placements, puzzle.characters, puzzle.map.gridSize)
          : null,
    })
  }, [open, puzzle, placements, includePlacements, placedCount])

  // Enlace construido en runtime: válido en dev (base /) y en GitHub Pages.
  const link = `${window.location.origin}${window.location.pathname}#c=${code}`

  const handleCopy = async (what) => {
    const ok = await copyText(what === 'link' ? link : code)
    if (!ok) return
    setCopied(what)
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(null), 1800)
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      ariaLabel="Compartir partida"
      panelClassName="w-full max-w-md p-7 text-center"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/15">
        <Share2 size={26} className="text-gold-deep" />
      </div>
      <h2 className="font-serif text-3xl font-semibold text-plum-900">Compartir el caso</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-plum-800">
        Quien reciba este código jugará exactamente el mismo tablero y las mismas pistas.
      </p>

      {/* Código seleccionable: siempre visible aunque falle el portapapeles. */}
      <p
        className="mt-5 select-all break-all rounded-xl border border-gold/20 bg-cream-200/70 px-4 py-3 font-pixel text-xl tracking-wider text-plum-900"
        data-testid="share-code"
      >
        {code}
      </p>

      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 text-[13px] font-medium text-plum-800">
        <input
          type="checkbox"
          checked={includePlacements}
          onChange={(e) => setIncludePlacements(e.target.checked)}
          disabled={placedCount === 0}
          className="h-4 w-4 accent-gold-deep"
        />
        Incluir mis fichas colocadas
        {placedCount === 0 ? ' (no hay ninguna)' : ` (${placedCount})`}
      </label>

      <div className="mt-5 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => handleCopy('code')}
          className="flex items-center gap-2 rounded-full border border-gold/20 bg-cream-200/70 px-5 py-2.5 text-sm font-medium text-plum-900 hover:bg-cream-300/70"
        >
          {copied === 'code' ? <Check size={16} className="text-sage-deep" /> : <Copy size={16} />}
          {copied === 'code' ? 'Copiado' : 'Copiar código'}
        </button>
        <button
          type="button"
          onClick={() => handleCopy('link')}
          className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-plum-950 transition hover:bg-gold-soft"
        >
          {copied === 'link' ? <Check size={16} /> : <Link2 size={16} />}
          {copied === 'link' ? 'Copiado' : 'Copiar enlace'}
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-plum-600 hover:text-plum-800"
      >
        <X size={14} /> Cerrar
      </button>
    </ModalShell>
  )
}
