// Una celda del tablero: tinte de habitación, mobiliario, ficha y línea de control.
//
// `geometry` agrupa los datos estáticos de la celda (calculados una vez por
// puzzle en useBoardGeometry); el resto de props son estado dinámico de la
// partida. Memoizado: con `geometry`/`characters` de referencia estable, una
// celda solo se vuelve a renderizar si cambia su propio estado.

import { memo, useCallback, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { cellKey } from '@/game/constants.js'
import { FurnitureIcon } from './Furniture.jsx'
import { DraggableToken, TokenChip } from './CharacterToken.jsx'
import { ControlMark } from './ControlMark.jsx'
import { colorForCharacter } from './palette.js'
import CellMarkPopup from './CellMarkPopup.jsx'
import {
  WINDOW_BORDER_SIDE,
  REVEAL_TINT,
  REVEAL_HIGHLIGHT,
  DROP_OUTLINE,
  SELECTED_OUTLINE,
  windowBorder,
  windowGlassStyle,
  floorPatternStyle,
} from './boardCell.js'

// Grosor del marco de ventana (px) e inset del cristal en el tablero de juego.
const WINDOW_FRAME_PX = 5
const GLASS_INSET = 8

// Anotaciones del jugador: las iniciales de los sospechosos que ha marcado como
// candidatos de esta casilla. Se quedan visibles aunque haya una ficha encima
// —son su razonamiento, no el estado del tablero—, así que van apiladas abajo
// para no taparle la cara a la ficha. Tamaño y tipografía se escalan con la
// celda, con un mínimo legible para que sigan leyéndose a 36 px en móvil.
function CandidateMarks({ names, characters, size }) {
  if (names.length === 0) return null
  const dot = Math.max(12, Math.round(size * 0.2))
  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-wrap items-end justify-center gap-px p-0.5"
      style={{ alignContent: 'end' }}
    >
      {names.map((name) => (
        <span
          key={name}
          className="inline-flex items-center justify-center rounded-full text-white font-bold leading-none"
          style={{
            width: dot,
            height: dot,
            fontSize: Math.max(7, Math.round(size * 0.12)),
            background: colorForCharacter(name, characters).bg,
            boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
          }}
          title={name}
        >
          {name[0]}
        </span>
      ))}
    </div>
  )
}

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

  const cellMarks = marks?.[cellKey(r, c)] || []
  const isMarkingThis = markingCell?.r === r && markingCell?.c === c

  const occupantSuffix = occupantName ? `, ${occupantName}` : ''
  const cellLabel = `Casilla fila ${r + 1}, columna ${c + 1}${occupantSuffix}`

  // Fondo de la celda. La de alfombra no pinta NINGUNO: la celda se dibuja
  // después que la capa de alfombra (ver Board.jsx), así que cualquier fondo
  // aquí la taparía. El suelo que asoma por el margen y las esquinas
  // redondeadas lo pinta la propia alfombra, bajo su tejido (ver Rug.jsx).
  let background = tint
  if (revealCell) background = REVEAL_TINT
  else if (isRug) background = 'transparent'

  // Contorno de interacción: `canDrop` gana si coincide con `isMarkingThis`
  // (no debería pasar en la práctica, son dos modos de interacción distintos,
  // pero un gesto en curso —arrastrar una ficha— es más urgente que "esta es
  // la casilla que estoy anotando").
  let outline = 'none'
  if (canDrop) outline = DROP_OUTLINE
  else if (isMarkingThis) outline = SELECTED_OUTLINE

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
        background,
        borderTop: borders.top,
        borderRight: borders.right,
        borderBottom: borders.bottom,
        borderLeft: borders.left,
        ...(isWindow && wall
          ? { [WINDOW_BORDER_SIDE[wall]]: windowBorder(zone, WINDOW_FRAME_PX) }
          : null),
        cursor: clickable ? 'pointer' : 'default',
        outline,
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

      {/* Suelo: el material lo pone la habitación, el color la zona. */}
      {!isRug && (
        <div
          className="pointer-events-none absolute inset-0"
          style={floorPatternStyle(zone, roomName, size)}
        />
      )}

      {label && (
        <span className="pointer-events-none absolute left-1 top-0.5 font-pixel text-[12px] font-semibold uppercase tracking-[0.08em] text-plum-700/80">
          {label}
        </span>
      )}

      {/* La alfombra no se dibuja aquí, es una capa única a nivel de tablero
          (ver Board.jsx); esta celda solo le deja el hueco. */}
      {!occupantName && furniture && !isRug && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-75">
          <FurnitureIcon type={furniture} zone={zone} size={Math.round(size * 0.42)} />
        </div>
      )}

      {isWindow && wall && (
        <div
          className="pointer-events-none absolute"
          style={windowGlassStyle(zone, wall, GLASS_INSET)}
        />
      )}

      {/* Aspa de línea de control (ver ControlMark.jsx). */}
      {controlled && !occupantName && (
        <ControlMark size={Math.round(size * 0.5)} className="pointer-events-none absolute" />
      )}

      <CandidateMarks names={cellMarks} characters={characters} size={size} />

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
