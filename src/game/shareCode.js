// Código compartible de partida (v2). Puro, sin dependencias de React.
//
// La generación es 100% determinista (mulberry32): basta transportar
// (dificultad, irregular, seed) para que el receptor reconstruya tablero,
// personajes y pistas idénticos con generatePuzzle. Opcionalmente viajan las
// fichas colocadas por el emisor, como índice de celda por personaje.
//
// Formato (bitstream MSB-first, relleno con ceros a múltiplo de 5):
//   char 0      : versión, literal '2'
//   bits 0-2    : dificultad (índice en DIFF_ORDER)
//   bit  3      : irregular
//   bit  4      : hasPlacements
//   bits 5-36   : seed (uint32)
//   [N × 7 bits]: si hasPlacements, celda de cada personaje en orden canónico
//                 (sospechosos en orden alfabético + víctima al final);
//                 valor = fila*gridSize+columna, 127 = sin colocar.
//   último char : checksum — valor base32 de la suma de los valores de todos
//                 los chars anteriores (incluida la versión) mod 32.
//
// v1 (2 bits de dificultad, 6 por celda) se sigue LEYENDO: sus cuatro niveles
// son los cuatro primeros de hoy con otro nombre y la misma configuración, así
// que un código antiguo reconstruye exactamente el mismo caso. Ya no se emite:
// 6 niveles no caben en 2 bits, ni una celda de un 9×9 (hasta 80) en 6.
//
// Alfabeto Base32 Crockford (sin I, L, O, U): apto para dictarse en voz alta;
// el decodificador acepta minúsculas y corrige O→0, I/L→1.

import { DIFFICULTIES } from './constants.js'

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const VERSION_CHAR = '2'
// El orden es parte del FORMATO: no cambiarlo aunque cambie constants.js. Los
// niveles nuevos se añaden AL FINAL, aunque en la UI vayan por en medio.
const DIFF_ORDER = ['novato', 'aspirante', 'detective', 'investigador', 'experto', 'sherlock']
const DIFF_BITS = 3
const CELL_BITS = 7
// Sentinel de "sin colocar" (todos los bits de la celda a 1). Se exporta
// porque es parte del contrato de `placementIndices`, no un detalle interno.
export const UNPLACED = (1 << CELL_BITS) - 1
const HEADER_BITS = DIFF_BITS + 2 + 32

// Formato heredado: mismos cuatro casos, otros nombres y campos más estrechos.
const LEGACY = {
  1: {
    order: ['novato', 'aspirante', 'detective', 'investigador'],
    diffBits: 2,
    cellBits: 6,
    headerBits: 36,
  },
}

// Error de decodificación con mensaje apto para mostrar al jugador.
export class ShareCodeError extends Error {}

const charValue = (ch) => ALPHABET.indexOf(ch)

// ── Bitstream ────────────────────────────────────────────────────────────────

function bitsToChars(bits) {
  let out = ''
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0')
    out += ALPHABET[Number.parseInt(chunk, 2)]
  }
  return out
}

const toBits = (value, width) => value.toString(2).padStart(width, '0')

// ── Codificación ─────────────────────────────────────────────────────────────

// `placementIndices`: array de N índices de celda (o null si no se comparten
// fichas), en el orden canónico de personajes. Devuelve el código formateado
// en grupos de 4 con guiones.
export function encodeShareCode({ difficultyId, seed, irregular = false, placementIndices = null }) {
  const diffIdx = DIFF_ORDER.indexOf(difficultyId)
  if (diffIdx < 0) throw new Error(`Dificultad desconocida: ${difficultyId}`)

  let bits = toBits(diffIdx, DIFF_BITS) + (irregular ? '1' : '0') + (placementIndices ? '1' : '0')
  bits += toBits(seed >>> 0, 32)
  if (placementIndices) {
    for (const idx of placementIndices) bits += toBits(idx, CELL_BITS)
  }

  const body = VERSION_CHAR + bitsToChars(bits)
  const sum = [...body].reduce((acc, ch) => acc + charValue(ch), 0)
  const raw = body + ALPHABET[sum % 32]
  return raw.replace(/(.{4})(?=.)/g, '$1-')
}

// Convierte las fichas del emisor a índices en el orden canónico.
export function placementsToIndices(placements, characters, gridSize) {
  const order = [...characters.suspects, characters.victim]
  return order.map((name) => {
    const p = placements[name]
    return p ? p.row * gridSize + p.col : UNPLACED
  })
}

// ── Decodificación ───────────────────────────────────────────────────────────

// Normaliza la entrada del usuario: guiones/espacios fuera, mayúsculas y
// sustitución de los caracteres ambiguos que Crockford excluye del alfabeto.
function normalize(str) {
  return str
    .replace(/[-\s]/g, '')
    .toUpperCase()
    .replaceAll('O', '0')
    .replace(/[IL]/g, '1')
}

export function decodeShareCode(str) {
  const code = normalize(String(str ?? ''))
  if (code.length === 0) throw new ShareCodeError('El código está vacío')
  const layout =
    code[0] === VERSION_CHAR
      ? { order: DIFF_ORDER, diffBits: DIFF_BITS, cellBits: CELL_BITS, headerBits: HEADER_BITS }
      : LEGACY[code[0]]
  if (!layout) throw new ShareCodeError('Código de una versión no compatible')
  if (code.length < 3 || [...code].some((ch) => charValue(ch) < 0)) {
    throw new ShareCodeError('El código contiene caracteres no válidos o está incompleto')
  }

  const body = code.slice(0, -1)
  const sum = [...body].reduce((acc, ch) => acc + charValue(ch), 0)
  if (ALPHABET[sum % 32] !== code[code.length - 1]) {
    throw new ShareCodeError('El código tiene una errata: revisa que esté copiado entero')
  }

  const bits = Array.from(body.slice(1), (ch) => toBits(charValue(ch), 5)).join('')
  const read = (from, width) => Number.parseInt(bits.slice(from, from + width), 2)
  const { order, diffBits, cellBits, headerBits } = layout

  if (bits.length < headerBits) throw new ShareCodeError('El código está incompleto')
  const difficultyId = order[read(0, diffBits)]
  const irregular = read(diffBits, 1) === 1
  const hasPlacements = read(diffBits + 1, 1) === 1
  const seed = read(diffBits + 2, 32) >>> 0
  // En v2 sobran combinaciones de 3 bits: las dos últimas no son ningún nivel.
  if (!difficultyId) throw new ShareCodeError('El código apunta a una dificultad que no existe')

  const { gridSize, numCharacters } = DIFFICULTIES[difficultyId]
  const expectedBits = headerBits + (hasPlacements ? numCharacters * cellBits : 0)
  const expectedChars = 1 + Math.ceil(expectedBits / 5) + 1
  if (code.length !== expectedChars) {
    throw new ShareCodeError('El código no tiene la longitud esperada')
  }

  let placementIndices = null
  if (hasPlacements) {
    const unplaced = (1 << cellBits) - 1
    placementIndices = []
    for (let i = 0; i < numCharacters; i++) {
      const idx = read(headerBits + i * cellBits, cellBits)
      if (idx !== unplaced && idx >= gridSize * gridSize) {
        throw new ShareCodeError('El código contiene una posición fuera del tablero')
      }
      placementIndices.push(idx === unplaced ? UNPLACED : idx)
    }
  }

  return { difficultyId, seed, irregular, placementIndices }
}

// Convierte los índices decodificados a fichas { nombre: { row, col } } en el
// orden canónico. Ignora los sentinels; la validación de ocupabilidad y
// duplicados la hace el caller con el mapa ya regenerado.
export function indicesToPlacements(indices, characters, gridSize) {
  const order = [...characters.suspects, characters.victim]
  const placements = {}
  indices.forEach((idx, i) => {
    if (idx === UNPLACED || i >= order.length) return
    placements[order[i]] = { row: Math.floor(idx / gridSize), col: idx % gridSize }
  })
  return placements
}
