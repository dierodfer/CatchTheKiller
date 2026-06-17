// Catálogo de tipos de pista (sección 5 del documento).
//
// Cada tipo define:
//   - tier:     categoría de dificultad (absolute | room | relative | advanced)
//   - unary:    true si depende solo de la celda del propio sujeto
//   - evaluate: predicado verificable matemáticamente
//   - text:     redacción en primera persona
//
// El evaluador es la base tanto del generador de pistas como del Solver:
// "la IA propone, el Solver decide" — aquí no hay IA, la lógica es la autoridad.

import { ADJACENT, ROOM_ARTICLE, cellKey } from './constants.js'
import { ELEMENTS, MUEBLE_ELEMENTS, elementPhrase } from './elements.js'

// Frase "el/la <habitación>" con el artículo correcto (concordancia de género).
const roomPhrase = (room) => `${ROOM_ARTICLE[room] ?? 'el'} ${room}`

function isCorner(pos, size) {
  return (pos.row === 0 || pos.row === size - 1) && (pos.col === 0 || pos.col === size - 1)
}

function isBorder(pos, size) {
  return pos.row === 0 || pos.col === 0 || pos.row === size - 1 || pos.col === size - 1
}

function adjacentHas(ctx, pos, predicate) {
  for (const [dr, dc] of ADJACENT) {
    const nr = pos.row + dr
    const nc = pos.col + dc
    if (nr < 0 || nc < 0 || nr >= ctx.gridSize || nc >= ctx.gridSize) continue
    if (predicate(nr, nc)) return true
  }
  return false
}

export const CLUE_TYPES = {
  // ───────── Posición en habitación ─────────
  inRoom: {
    tier: 'room',
    unary: true,
    evaluate: (pos, p, _all, ctx) => ctx.roomAt(pos.row, pos.col) === p.room,
    text: (p) => `Estaba en ${roomPhrase(p.room)}`,
  },
  notInRoom: {
    tier: 'room',
    unary: true,
    evaluate: (pos, p, _all, ctx) => ctx.roomAt(pos.row, pos.col) !== p.room,
    text: (p) => `No estaba en ${roomPhrase(p.room)}`,
  },
  aloneInRoom: {
    tier: 'room',
    unary: false,
    evaluate: (pos, _p, all, ctx) => {
      const myRoom = ctx.roomAt(pos.row, pos.col)
      for (const name of ctx.everyone) {
        const op = all[name]
        if (!op) continue
        // Cada personaje ocupa una celda única: la coincidente es uno mismo.
        if (op.row === pos.row && op.col === pos.col) continue
        if (ctx.roomAt(op.row, op.col) === myRoom) return false
      }
      return true
    },
    text: () => `Estaba solo en mi habitación`,
  },
  withInRoom: {
    tier: 'room',
    unary: false,
    evaluate: (pos, p, all, ctx) => {
      const op = all[p.other]
      return !!op && ctx.roomAt(pos.row, pos.col) === ctx.roomAt(op.row, op.col)
    },
    text: (p) => `Estaba con ${p.other} en la misma habitación`,
  },
  notWithInRoom: {
    tier: 'room',
    unary: false,
    evaluate: (pos, p, all, ctx) => {
      const op = all[p.other]
      return !!op && ctx.roomAt(pos.row, pos.col) !== ctx.roomAt(op.row, op.col)
    },
    text: (p) => `No estaba con ${p.other} en la misma habitación`,
  },

  // ───────── Posición absoluta en cuadrícula ─────────
  inRow: {
    tier: 'absolute',
    unary: true,
    evaluate: (pos, p) => pos.row === p.row,
    text: (p) => `Estaba en la fila ${p.row + 1}`,
  },
  notInRow: {
    tier: 'absolute',
    unary: true,
    evaluate: (pos, p) => pos.row !== p.row,
    text: (p) => `No estaba en la fila ${p.row + 1}`,
  },
  inColumn: {
    tier: 'absolute',
    unary: true,
    evaluate: (pos, p) => pos.col === p.col,
    text: (p) => `Estaba en la columna ${String.fromCharCode(65 + p.col)}`,
  },
  notInColumn: {
    tier: 'absolute',
    unary: true,
    evaluate: (pos, p) => pos.col !== p.col,
    text: (p) => `No estaba en la columna ${String.fromCharCode(65 + p.col)}`,
  },
  inCorner: {
    tier: 'absolute',
    unary: true,
    evaluate: (pos, _p, _all, ctx) => isCorner(pos, ctx.gridSize),
    text: () => `Estaba en una esquina del mapa`,
  },
  notInCorner: {
    tier: 'absolute',
    unary: true,
    evaluate: (pos, _p, _all, ctx) => !isCorner(pos, ctx.gridSize),
    text: () => `No estaba en una esquina`,
  },
  inBorder: {
    tier: 'absolute',
    unary: true,
    evaluate: (pos, _p, _all, ctx) => isBorder(pos, ctx.gridSize),
    text: () => `Estaba en el borde del mapa`,
  },
  notInBorder: {
    tier: 'absolute',
    unary: true,
    evaluate: (pos, _p, _all, ctx) => !isBorder(pos, ctx.gridSize),
    text: () => `No estaba en el borde del mapa`,
  },

  // ───────── Posición relativa entre personajes ─────────
  // Nadie comparte fila ni columna con nadie (regla del asesino), así que las
  // cuatro direcciones cardinales (fila y columna) son siempre comparables.
  rowAbove: {
    tier: 'relative',
    unary: false,
    evaluate: (pos, p, all) => {
      const op = all[p.other]
      return !!op && pos.row < op.row
    },
    text: (p) => `Estaba al norte de ${p.other}`,
  },
  rowBelow: {
    tier: 'relative',
    unary: false,
    evaluate: (pos, p, all) => {
      const op = all[p.other]
      return !!op && pos.row > op.row
    },
    text: (p) => `Estaba al sur de ${p.other}`,
  },
  colLeft: {
    tier: 'relative',
    unary: false,
    evaluate: (pos, p, all) => {
      const op = all[p.other]
      return !!op && pos.col < op.col
    },
    text: (p) => `Estaba a la izquierda de ${p.other}`,
  },
  colRight: {
    tier: 'relative',
    unary: false,
    evaluate: (pos, p, all) => {
      const op = all[p.other]
      return !!op && pos.col > op.col
    },
    text: (p) => `Estaba a la derecha de ${p.other}`,
  },

  // ───────── Proximidad a elementos del mapa ─────────
  // Pista "junto a una X" para cualquier elemento (param `element` = id).
  nextToElement: {
    tier: 'room',
    unary: true,
    // Solo cuenta el elemento si está en la MISMA habitación que el personaje:
    // una celda contigua puede pertenecer a otra habitación y su elemento no
    // debe referenciarse.
    //
    // Además, "junto a" excluye "encima de": si el personaje ocupa una celda del
    // mismo tipo de elemento (silla/alfombra/cama), la pista no aplica aunque
    // haya otra contigua igual — la redacción correcta sería "estaba sobre la
    // alfombra", no "junto a una alfombra". Sin este filtro sería engañosa.
    evaluate: (pos, p, _all, ctx) =>
      ctx.furnitureAt(pos.row, pos.col) !== p.element &&
      adjacentHas(
        ctx,
        pos,
        (r, c) =>
          ctx.furnitureAt(r, c) === p.element &&
          ctx.roomAt(r, c) === ctx.roomAt(pos.row, pos.col),
      ),
    text: (p) => `Estaba junto a ${elementPhrase(p.element)}`,
  },
  // La ventana forma parte de la pared de su celda: estar "junto a la ventana"
  // significa ocupar esa misma celda (no una contigua).
  nextToWindow: {
    tier: 'room',
    unary: true,
    evaluate: (pos, _p, _all, ctx) => ctx.isWindow(pos.row, pos.col),
    text: () => `Estaba junto a una ventana`,
  },
  // "Ningún mueble" considera SOLO los elementos marcados como mueble
  // (alfombra y planta no cuentan).
  notNextToMueble: {
    tier: 'room',
    unary: true,
    evaluate: (pos, _p, _all, ctx) =>
      !adjacentHas(
        ctx,
        pos,
        (r, c) =>
          MUEBLE_ELEMENTS.includes(ctx.furnitureAt(r, c)) &&
          ctx.roomAt(r, c) === ctx.roomAt(pos.row, pos.col),
      ),
    text: () => `No estaba junto a ningún mueble`,
  },
  // Pista "encima de" para cualquier elemento ocupable (param `element` = id);
  // la redacción la define `onText` del propio elemento.
  onElement: {
    tier: 'room',
    unary: true,
    evaluate: (pos, p, _all, ctx) => ctx.furnitureAt(pos.row, pos.col) === p.element,
    text: (p) => ELEMENTS[p.element].onText,
  },
}

// Evalúa una pista concreta sobre un conjunto de posiciones.
export function evalClue(clue, placements, ctx) {
  const pos = placements[clue.subject]
  if (!pos) return false
  return CLUE_TYPES[clue.kind].evaluate(pos, clue.params || {}, placements, ctx)
}

// Construye el contexto compartido por evaluador, generador y Solver.
export function buildClueContext(map, roomLookup, characters) {
  const windowSet = new Set(map.windows.map((w) => cellKey(w.row, w.col)))
  const everyone = [...characters.suspects, characters.victim]
  // Índice inverso posición -> nombre, recalculado por evaluación de aloneInRoom.
  return {
    gridSize: map.gridSize,
    everyone,
    roomAt: (r, c) => roomLookup[cellKey(r, c)],
    furnitureAt: (r, c) =>
      r >= 0 && c >= 0 && r < map.gridSize && c < map.gridSize ? map.grid[r][c] : null,
    isWindow: (r, c) => windowSet.has(cellKey(r, c)),
  }
}
