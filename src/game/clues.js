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

import { ADJACENT, cellKey, roomPhrase } from './constants.js'
import { MUEBLE_ELEMENTS, elementPhrase, elementCountPhrase } from './elements.js'
import { resolveElements, resolveRooms } from './zones.js'
import { computeExteriorVoid } from './mapShapes.js'

// Frase "las N esquinas del mapa" para las pistas de esquina. Las esquinas son
// los cuatro vértices del tablero (ver `isCornerCell`), así que N vale 4 salvo
// que un mapa irregular haya recortado alguno. Decir el número es la
// información que faltaba: sin ella, en un mapa recortado el jugador cuenta
// cuatro esquinas y busca en un vértice que ya no existe.
const cornersPhrase = (ctx) =>
  ctx.cornerCount === 1 ? 'la única esquina del mapa' : `las ${ctx.cornerCount} esquinas del mapa`

function adjacentHas(ctx, pos, predicate) {
  for (const [dr, dc] of ADJACENT) {
    const nr = pos.row + dr
    const nc = pos.col + dc
    if (!ctx.cellExists(nr, nc)) continue
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
    text: (p, ctx) => `Estaba en ${roomPhrase(ctx.rm, p.room)}`,
  },
  notInRoom: {
    tier: 'room',
    unary: true,
    evaluate: (pos, p, _all, ctx) => ctx.roomAt(pos.row, pos.col) !== p.room,
    text: (p, ctx) => `No estaba en ${roomPhrase(ctx.rm, p.room)}`,
  },
  // "No compartía habitación con ningún otro sospechoso". A diferencia de
  // "estaba solo", NO excluye a la víctima: el asesino (a solas con la víctima)
  // también la cumple, así que la pista nunca delata quién NO es el asesino.
  // Mantiene casi toda la fuerza de desambiguación de habitaciones.
  noSuspectInRoom: {
    tier: 'room',
    unary: false,
    evaluate: (pos, _p, all, ctx) => {
      const myRoom = ctx.roomAt(pos.row, pos.col)
      for (const name of ctx.suspects) {
        const op = all[name]
        if (!op) continue
        // Cada personaje ocupa una celda única: la coincidente es uno mismo.
        if (op.row === pos.row && op.col === pos.col) continue
        if (ctx.roomAt(op.row, op.col) === myRoom) return false
      }
      return true
    },
    text: () => `No compartía habitación con ningún otro sospechoso`,
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
    text: (p) => `Estaba en la columna ${String.fromCodePoint(65 + p.col)}`,
  },
  notInColumn: {
    tier: 'absolute',
    unary: true,
    evaluate: (pos, p) => pos.col !== p.col,
    text: (p) => `No estaba en la columna ${String.fromCodePoint(65 + p.col)}`,
  },
  // Las pistas de esquina nombran cuántas esquinas tiene el mapa: son los cuatro
  // vértices del tablero, menos los que un mapa irregular haya recortado (ver
  // `isCornerCell` y `cornersPhrase`).
  inCorner: {
    tier: 'absolute',
    unary: true,
    evaluate: (pos, _p, _all, ctx) => ctx.isCornerCell(pos.row, pos.col),
    text: (_p, ctx) =>
      ctx.cornerCount === 1
        ? `Estaba en ${cornersPhrase(ctx)}`
        : `Estaba en una de ${cornersPhrase(ctx)}`,
  },
  notInCorner: {
    tier: 'absolute',
    unary: true,
    evaluate: (pos, _p, _all, ctx) => !ctx.isCornerCell(pos.row, pos.col),
    text: (_p, ctx) =>
      ctx.cornerCount === 1
        ? `No estaba en ${cornersPhrase(ctx)}`
        : `No estaba en ninguna de ${cornersPhrase(ctx)}`,
  },
  inBorder: {
    tier: 'absolute',
    unary: true,
    evaluate: (pos, _p, _all, ctx) => ctx.isBorderCell(pos.row, pos.col),
    text: () => `Estaba en el borde del mapa`,
  },
  notInBorder: {
    tier: 'absolute',
    unary: true,
    evaluate: (pos, _p, _all, ctx) => !ctx.isBorderCell(pos.row, pos.col),
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
    text: (p, ctx) => `Estaba junto a ${elementPhrase(ctx.el, p.element)}`,
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
    text: (p, ctx) => ctx.el[p.element].onText,
  },

  // ───────── Propiedades de la habitación ─────────
  roomSize: {
    tier: 'room',
    unary: true,
    evaluate: (pos, p, _all, ctx) => {
      const n = ctx.roomCells(ctx.roomAt(pos.row, pos.col))
      return p.size === 'grande' ? n >= 6 : n <= 3
    },
    text: (p) => `Estaba en una habitación ${p.size}`,
  },
  // Conteo ambiguo de un elemento en la habitación: "más de 1 cama" (≥2) o
  // "menos de 2 plantas" (≤1). No revela la cifra exacta — solo una cota — y por
  // eso resulta menos delator que afirmar la presencia concreta de un elemento.
  roomElementCount: {
    tier: 'room',
    unary: true,
    evaluate: (pos, p, _all, ctx) => {
      const n = ctx.roomElementCount(ctx.roomAt(pos.row, pos.col), p.element)
      return p.op === 'masDe' ? n > p.value : n < p.value
    },
    text: (p, ctx) =>
      `En mi habitación había ${p.op === 'masDe' ? 'más' : 'menos'} de ` +
      `${elementCountPhrase(ctx.el, p.element, p.value)}`,
  },
  roomWindowCount: {
    tier: 'room',
    unary: true,
    evaluate: (pos, p, _all, ctx) =>
      ctx.roomWindows(ctx.roomAt(pos.row, pos.col)) === p.count,
    text: (p) => {
      if (p.count === 0) return 'Mi habitación no tenía ventanas'
      const plural = p.count > 1 ? 's' : ''
      return `Mi habitación tenía ${p.count} ventana${plural}`
    },
  },

}

// Identidad estable de una pista: dos pistas con el mismo sujeto, tipo y
// parámetros son la misma pista. Se usa para deduplicar durante la generación
// y para referenciar pistas concretas desde el estado y la partida guardada.
export const clueId = (c) => `${c.subject}|${c.kind}|${JSON.stringify(c.params)}`

// Evalúa una pista concreta sobre un conjunto de posiciones.
export function evalClue(clue, placements, ctx) {
  const pos = placements[clue.subject]
  if (!pos) return false
  return CLUE_TYPES[clue.kind].evaluate(pos, clue.params || {}, placements, ctx)
}

// Construye el contexto compartido por evaluador, generador y Solver.
//
// `zoneId` solo afecta a la REDACCIÓN (`ctx.el`, los nombres de los elementos en
// esa ambientación); ningún `evaluate` lo mira. Por eso quien solo evalúa
// predicados —el Solver, el generador de soluciones, los tests— puede omitirlo
// y quedarse con los nombres base.
export function buildClueContext(map, roomLookup, characters, zoneId) {
  const windowSet = new Set(map.windows.map((w) => cellKey(w.row, w.col)))
  const everyone = [...characters.suspects, characters.victim]
  const suspects = [...characters.suspects]

  // Índices precomputados para las pistas de habitación: nº de celdas, conteo de
  // cada elemento por sala y nº de ventanas por sala.
  const roomCellCount = {}
  const roomElemCounts = {}
  for (const room of map.rooms) {
    roomCellCount[room.name] = room.cells.length
    const counts = {}
    for (const [r, c] of room.cells) {
      const e = map.grid[r][c]
      if (e) counts[e] = (counts[e] || 0) + 1
    }
    roomElemCounts[room.name] = counts
  }
  const roomWindowCount = {}
  for (const w of map.windows) {
    const rn = roomLookup[cellKey(w.row, w.col)]
    roomWindowCount[rn] = (roomWindowCount[rn] || 0) + 1
  }

  // BORDE en términos de LADOS EXTERIORES, no de índices: en mapas irregulares
  // el perímetro real incluye los recortes (una celda junto a una esquina
  // eliminada sigue "en el borde"), y el hueco de un donut es patio interior —
  // sus celdas vecinas NO están en el borde del mapa. En tableros clásicos
  // ambas definiciones coinciden con la fórmula de índice antigua.
  const size = map.gridSize
  const voidCells = map.voidCells ?? new Set()
  const exteriorVoid = computeExteriorVoid(size, voidCells)
  const cellExists = (r, c) =>
    r >= 0 && c >= 0 && r < size && c < size && !voidCells.has(cellKey(r, c))
  const sideExterior = (r, c) =>
    r < 0 || c < 0 || r >= size || c >= size || exteriorVoid.has(cellKey(r, c))
  const isBorderCell = (r, c) =>
    sideExterior(r - 1, c) || sideExterior(r + 1, c) || sideExterior(r, c - 1) || sideExterior(r, c + 1)

  // ESQUINA, en cambio, sí es cuestión de índices: son los cuatro vértices del
  // tablero y solo esos, nunca más de cuatro. Un recorte puede quitar un vértice
  // (deja de contar, y quedan menos de cuatro), pero JAMÁS asciende a esquina a
  // la celda vecina: para quien mira el tablero las esquinas son las del marco,
  // no cualquier celda que quede en ángulo tras un mordisco del perímetro.
  const isCornerCell = (r, c) =>
    (r === 0 || r === size - 1) && (c === 0 || c === size - 1) && cellExists(r, c)

  // Cuántos de los cuatro vértices siguen en pie. La redacción de las pistas de
  // esquina lo nombra (ver `cornersPhrase`) para que en un mapa irregular no se
  // busque en un vértice recortado. Es geometría visible en el tablero: contarla
  // no filtra nada de la solución.
  let cornerCount = 0
  for (const r of [0, size - 1]) {
    for (const c of [0, size - 1]) {
      if (isCornerCell(r, c)) cornerCount++
    }
  }

  return {
    gridSize: map.gridSize,
    // Nombres de los elementos y de las habitaciones en esta zona (ver
    // game/zones.js). Ninguno de los dos lo mira `evaluate` — solo `text`.
    el: resolveElements(zoneId),
    rm: resolveRooms(zoneId),
    everyone,
    suspects,
    cellExists,
    isBorderCell,
    isCornerCell,
    cornerCount,
    roomAt: (r, c) => roomLookup[cellKey(r, c)],
    furnitureAt: (r, c) =>
      r >= 0 && c >= 0 && r < map.gridSize && c < map.gridSize ? map.grid[r][c] : null,
    isWindow: (r, c) => windowSet.has(cellKey(r, c)),
    roomCells: (roomName) => roomCellCount[roomName] || 0,
    roomElementCount: (roomName, elementId) => roomElemCounts[roomName]?.[elementId] || 0,
    roomWindows: (roomName) => roomWindowCount[roomName] || 0,
  }
}
