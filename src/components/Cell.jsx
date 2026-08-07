// Una celda del tablero: tinte de habitación, mobiliario, ficha y línea de control.
//
// `geometry` agrupa los datos estáticos de la celda (calculados una vez por
// puzzle en useBoardGeometry); el resto de props son estado dinámico de la
// partida. Memoizado: con `geometry`/`characters` de referencia estable, una
// celda solo se vuelve a renderizar si cambia su propio estado.

import { memo, useCallback, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { FurnitureIcon } from './Furniture.jsx'
import { DraggableToken, TokenChip } from './CharacterToken.jsx'
import { PixelGrid } from './pixelArt.jsx'
import { PIXEL_X_GRID, PIXEL_X_PALETTE } from './pixelSprites.js'
import { colorForCharacter } from './palette.js'
import CellMarkPopup from './CellMarkPopup.jsx'
import {
  WINDOW_BORDER_SIDE,
  REVEAL_TINT,
  REVEAL_HIGHLIGHT,
  DROP_OUTLINE,
  windowBorder,
  windowGlassStyle,
  floorPatternStyle,
} from './boardCell.js'

// Grosor del marco de ventana (px) e inset del cristal en el tablero de juego.
const WINDOW_FRAME_PX = 5
const GLASS_INSET = 8

function Cell({
  geometry,
  zone,
  characters,
  occupantName,
  controlled,
  revealCell,
  selectedToken,
  onCellClick,
  onTokenClick,
  revealMode,
  marks,
  markingCell,
  onMarkToggle,
  onMarkOpen,
  onMarkClose,
}) {
  const { r, c, size, tint, borders, label, furniture, isWindow, wall, occupiable } = geometry
  const { roomName } = geometry
  const isRug = furniture === 'alfombra'

  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${r}-${c}`,
    disabled: !occupiable,
  })

  // Ref propio a la celda (combinado con el de dnd-kit) para anclar el popup.
  const cellRef = useRef(null)
  const setRefs = useCallback(
    (node) => {
      cellRef.current = node
      setNodeRef(node)
    },
    [setNodeRef],
  )

  // Celda void (mapa irregular): hueco del tablero. Ocupa su sitio en la
  // rejilla pero es transparente (se ve el marco = exterior) y no interactúa.
  // Va tras los hooks para respetar sus reglas.
  if (geometry.isVoid) {
    return <div style={{ width: size, height: size }} aria-hidden />
  }

  const tokenSize = Math.round(size * 0.62)
  const canDrop = occupiable && (isOver || (selectedToken && !occupantName))
  const clickable = occupiable && !revealMode

  const cellMarks = marks?.[`${r},${c}`] || []
  const isMarkingThis = markingCell?.r === r && markingCell?.c === c

  const occupantSuffix = occupantName ? `, ${occupantName}` : ''
  const cellLabel = `Casilla fila ${r + 1}, columna ${c + 1}${occupantSuffix}`

  // Solo se invoca desde la diana de interacción, que únicamente se renderiza
  // cuando `clickable`; no hace falta volver a comprobarlo aquí.
  const handleClick = () => {
    if (selectedToken && !occupantName) {
      onCellClick(r, c)
    } else if (isMarkingThis) {
      onMarkClose()
    } else {
      onMarkOpen(r, c)
    }
  }

  return (
    <div
      ref={setRefs}
      data-rc={`${r}-${c}`}
      className="relative flex items-center justify-center"
      style={{
        width: size,
        height: size,
        // Sin tinte propio bajo la alfombra: la cubre por completo la capa de
        // Board.jsx (ver `rugBounds`), y un tinte por debajo solo se notaría
        // como un halo asomando por los bordes del marco.
        background: revealCell ? REVEAL_TINT : isRug ? 'transparent' : tint,
        borderTop: borders.top,
        borderRight: borders.right,
        borderBottom: borders.bottom,
        borderLeft: borders.left,
        ...(isWindow && wall
          ? { [WINDOW_BORDER_SIDE[wall]]: windowBorder(zone, WINDOW_FRAME_PX) }
          : null),
        cursor: clickable ? 'pointer' : 'default',
        outline: canDrop ? DROP_OUTLINE : 'none',
        outlineOffset: -2,
      }}
    >
      {/* Diana de interacción: botón nativo que cubre la celda (teclado y ratón
          gratis). Va primero en el DOM para que la ficha arrastrable y el resto
          de capas queden por encima y reciban sus propios clicks. */}
      {clickable && (
        <button
          type="button"
          onClick={handleClick}
          aria-label={cellLabel}
          className="absolute inset-0 cursor-pointer bg-transparent"
        />
      )}

      {/* Suelo: el material lo pone la habitación, el color la zona. Se omite
          bajo la alfombra — la cubre por completo, no tendría sentido que
          asomara un suelo que en realidad no se ve. */}
      {!isRug && (
        <div
          className="pointer-events-none absolute inset-0"
          style={floorPatternStyle(zone, roomName, size)}
        />
      )}

      {/* Etiqueta de habitación (una vez por habitación). */}
      {label && (
        <span className="pointer-events-none absolute left-1 top-0.5 font-pixel text-[12px] font-semibold uppercase tracking-[0.08em] text-plum-700/80">
          {label}
        </span>
      )}

      {/* La alfombra no se dibuja aquí: es una única capa a nivel de tablero
          (ver Board.jsx) para que su marco no se deforme sea cual sea la
          forma — esta celda solo le deja hueco (fondo transparente arriba). */}

      {/* Mobiliario (excepto alfombra), oculto si hay una ficha encima. */}
      {!occupantName && furniture && !isRug && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-75">
          <FurnitureIcon type={furniture} zone={zone} size={Math.round(size * 0.42)} />
        </div>
      )}

      {/* Ventana: cristal claro junto al tramo de pared marcado en azul. */}
      {isWindow && wall && (
        <div
          className="pointer-events-none absolute"
          style={windowGlassStyle(zone, wall, GLASS_INSET)}
        />
      )}

      {/* Marca × de línea de control. */}
      {controlled && !occupantName && (
        <PixelGrid
          grid={PIXEL_X_GRID}
          palette={PIXEL_X_PALETTE}
          size={Math.round(size * 0.5)}
          className="pointer-events-none absolute"
        />
      )}

      {/* Marcas de candidatos (anotaciones del jugador). Permanecen visibles
          aunque haya una ficha colocada encima. */}
      {cellMarks.length > 0 && (
        <div
          className="pointer-events-none absolute inset-0 flex flex-wrap items-end justify-center gap-px p-0.5"
          style={{ alignContent: 'end' }}
        >
          {cellMarks.map((name) => {
            const color = colorForCharacter(name, characters)
            return (
              <span
                key={name}
                className="inline-flex items-center justify-center rounded-full text-white font-bold leading-none"
                style={{
                  width: Math.max(12, Math.round(size * 0.2)),
                  height: Math.max(12, Math.round(size * 0.2)),
                  fontSize: Math.max(7, Math.round(size * 0.12)),
                  background: color.bg,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                }}
                title={name}
              >
                {name[0]}
              </span>
            )
          })}
        </div>
      )}

      {/* Ficha colocada. */}
      {occupantName && (
        <motion.div layoutId={`token-${occupantName}`} className="absolute">
          {revealMode ? (
            <TokenChip
              name={occupantName}
              characters={characters}
              size={tokenSize}
              highlight={revealCell ? REVEAL_HIGHLIGHT : undefined}
            />
          ) : (
            <DraggableToken
              name={occupantName}
              characters={characters}
              size={tokenSize}
              onClick={(e) => {
                e.stopPropagation()
                if (isMarkingThis) onMarkClose()
                else onMarkOpen(r, c)
              }}
            />
          )}
        </motion.div>
      )}

      {/* Popup de marcado. */}
      {isMarkingThis && (
        <CellMarkPopup
          r={r}
          c={c}
          characters={characters}
          marks={marks}
          occupantName={occupantName}
          onToggle={onMarkToggle}
          onRemove={onTokenClick}
          onClose={onMarkClose}
          cellSize={size}
          anchorRef={cellRef}
        />
      )}
    </div>
  )
}

export default memo(Cell)
