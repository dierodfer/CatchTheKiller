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

import { FURNITURE, ADJACENT } from './constants.js'

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
    text: (p) => `Estaba en el ${p.room}`,
  },
  notInRoom: {
    tier: 'room',
    unary: true,
    evaluate: (pos, p, _all, ctx) => ctx.roomAt(pos.row, pos.col) !== p.room,
    text: (p) => `No estaba en el ${p.room}`,
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
    text: (p) => `Estaba en la columna ${p.col + 1}`,
  },
  notInColumn: {
    tier: 'absolute',
    unary: true,
    evaluate: (pos, p) => pos.col !== p.col,
    text: (p) => `No estaba en la columna ${p.col + 1}`,
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
  rowAbove: {
    tier: 'relative',
    unary: false,
    evaluate: (pos, p, all) => {
      const op = all[p.other]
      return !!op && pos.row < op.row
    },
    text: (p) => `Estaba en una fila superior a ${p.other}`,
  },
  rowBelow: {
    tier: 'relative',
    unary: false,
    evaluate: (pos, p, all) => {
      const op = all[p.other]
      return !!op && pos.row > op.row
    },
    text: (p) => `Estaba en una fila inferior a ${p.other}`,
  },

  // ───────── Proximidad a mobiliario ─────────
  nextToFurniture: {
    tier: 'room',
    unary: true,
    evaluate: (pos, p, _all, ctx) =>
      adjacentHas(ctx, pos, (r, c) => ctx.furnitureAt(r, c) === p.furniture),
    text: (p) => `Estaba junto a una ${p.furniture === 'TV' ? 'TV' : p.furniture}`,
  },
  // La ventana forma parte de la pared de su celda: estar "junto a la ventana"
  // significa ocupar esa misma celda (no una contigua).
  nextToWindow: {
    tier: 'room',
    unary: true,
    evaluate: (pos, _p, _all, ctx) => ctx.isWindow(pos.row, pos.col),
    text: () => `Estaba junto a una ventana`,
  },
  notNextToFurniture: {
    tier: 'room',
    unary: true,
    evaluate: (pos, _p, _all, ctx) =>
      !adjacentHas(ctx, pos, (r, c) => FURNITURE.includes(ctx.furnitureAt(r, c))),
    text: () => `No estaba junto a ningún mueble`,
  },
  onChair: {
    tier: 'room',
    unary: true,
    evaluate: (pos, _p, _all, ctx) => ctx.furnitureAt(pos.row, pos.col) === 'silla',
    text: () => `Estaba sentado en una silla`,
  },
  onRug: {
    tier: 'room',
    unary: true,
    evaluate: (pos, _p, _all, ctx) => ctx.furnitureAt(pos.row, pos.col) === 'alfombra',
    text: () => `Estaba sobre la alfombra`,
  },
  onBed: {
    tier: 'room',
    unary: true,
    evaluate: (pos, _p, _all, ctx) => ctx.furnitureAt(pos.row, pos.col) === 'cama',
    text: () => `Estaba acostado en la cama`,
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
  const windowSet = new Set(map.windows.map((w) => `${w.row},${w.col}`))
  const everyone = [...characters.suspects, characters.victim]
  // Índice inverso posición -> nombre, recalculado por evaluación de aloneInRoom.
  return {
    gridSize: map.gridSize,
    everyone,
    roomAt: (r, c) => roomLookup[`${r},${c}`],
    furnitureAt: (r, c) =>
      r >= 0 && c >= 0 && r < map.gridSize && c < map.gridSize ? map.grid[r][c] : null,
    isWindow: (r, c) => windowSet.has(`${r},${c}`),
  }
}
