// Formas irregulares del tablero: recortes de esquina, donut (patio interior)
// y mordiscos aleatorios del perímetro. Una forma es un conjunto de celdas
// "void" (inexistentes): no pertenecen a ninguna habitación, no son ocupables
// y se pintan como exterior.
//
// Invariante crítico: el solutionGenerator coloca un personaje por fila vía
// una permutación de columnas, así que toda forma debe admitir un MATCHING
// PERFECTO filas→columnas sobre sus celdas existentes (y, tras el mobiliario,
// sobre las ocupables — generateMap lo re-valida). Además la región existente
// debe ser 4-conexa para que las habitaciones no queden partidas.

import { ADJACENT, IRREGULAR, cellKey } from './constants.js'
import { pick, randInt, shuffle } from './random.js'

// ¿Existe un emparejamiento fila→columna que use solo las celdas dadas?
// Algoritmo húngaro simplificado (caminos aumentantes); N ≤ 7, coste trivial.
export function hasPerfectMatching(cells, size) {
  const colsByRow = Array.from({ length: size }, () => [])
  for (const [r, c] of cells) colsByRow[r].push(c)
  const matchCol = new Array(size).fill(-1) // columna -> fila emparejada
  const tryRow = (r, visited) => {
    for (const c of colsByRow[r]) {
      if (visited[c]) continue
      visited[c] = true
      if (matchCol[c] === -1 || tryRow(matchCol[c], visited)) {
        matchCol[c] = r
        return true
      }
    }
    return false
  }
  for (let r = 0; r < size; r++) {
    if (!tryRow(r, new Array(size).fill(false))) return false
  }
  return true
}

// Una forma es viable si las celdas existentes son 4-conexas y admiten
// matching perfecto filas→columnas (aún sin mobiliario).
export function shapeIsViable(size, voidCells) {
  const cells = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!voidCells.has(cellKey(r, c))) cells.push([r, c])
    }
  }
  if (cells.length === 0) return false

  const alive = new Set(cells.map(([r, c]) => cellKey(r, c)))
  const seen = new Set([cellKey(cells[0][0], cells[0][1])])
  const stack = [cells[0]]
  while (stack.length) {
    const [r, c] = stack.pop()
    for (const [dr, dc] of ADJACENT) {
      const k = cellKey(r + dr, c + dc)
      if (alive.has(k) && !seen.has(k)) {
        seen.add(k)
        stack.push([r + dr, c + dc])
      }
    }
  }
  if (seen.size !== cells.length) return false

  return hasPerfectMatching(cells, size)
}

// Celdas void conectadas con el exterior del tablero (flood fill). Distingue
// los recortes del perímetro (exterior) del hueco de un donut (patio
// interior): las ventanas solo pueden dar al exterior.
export function computeExteriorVoid(size, voidCells) {
  const exterior = new Set()
  const queue = []
  for (const key of voidCells) {
    const [r, c] = key.split(',').map(Number)
    if (r === 0 || c === 0 || r === size - 1 || c === size - 1) {
      exterior.add(key)
      queue.push([r, c])
    }
  }
  while (queue.length) {
    const [r, c] = queue.pop()
    for (const [dr, dc] of ADJACENT) {
      const k = cellKey(r + dr, c + dc)
      if (voidCells.has(k) && !exterior.has(k)) {
        exterior.add(k)
        queue.push([r + dr, c + dc])
      }
    }
  }
  return exterior
}

// Recorte de una esquina: celdas relativas al vértice.
const CORNER_CUTS = {
  small: [[0, 0]],
  stair: [
    [0, 0],
    [0, 1],
    [1, 0],
  ],
}

// [vertical, horizontal]: 0 = arriba/izquierda, 1 = abajo/derecha.
const CORNERS = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
]

function cornersShape(rng, size, maxVoid) {
  const cutName = size >= 6 ? pick(rng, ['small', 'stair']) : 'small'
  const cut = CORNER_CUTS[cutName]
  const howMany = randInt(rng, 1, Math.min(4, Math.floor(maxVoid / cut.length)))
  const voidCells = new Set()
  for (const [down, right] of shuffle(rng, CORNERS).slice(0, howMany)) {
    for (const [dr, dc] of cut) {
      voidCells.add(cellKey(down ? size - 1 - dr : dr, right ? size - 1 - dc : dc))
    }
  }
  return voidCells
}

function donutShape(rng, size, hole) {
  // Hueco hole×hole centrado (con desplazamiento ±1) sin tocar el perímetro:
  // siempre queda un anillo completo de celdas existentes.
  const base = Math.floor((size - hole) / 2)
  const clamp = (v) => Math.max(1, Math.min(size - 1 - hole, v))
  const r0 = clamp(base + randInt(rng, -1, 1))
  const c0 = clamp(base + randInt(rng, -1, 1))
  const voidCells = new Set()
  for (let r = r0; r < r0 + hole; r++) {
    for (let c = c0; c < c0 + hole; c++) voidCells.add(cellKey(r, c))
  }
  return voidCells
}

function nibbleShape(rng, size, maxVoid) {
  // Mordiscos del perímetro, uno a uno, revalidando la viabilidad tras cada
  // eliminación: una celda que rompa conectividad o matching se descarta.
  const voidCells = new Set()
  const target = randInt(rng, 2, maxVoid)
  const perimeter = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (r === 0 || c === 0 || r === size - 1 || c === size - 1) perimeter.push([r, c])
    }
  }
  for (const [r, c] of shuffle(rng, perimeter)) {
    if (voidCells.size >= target) break
    const key = cellKey(r, c)
    voidCells.add(key)
    if (!shapeIsViable(size, voidCells)) voidCells.delete(key)
  }
  return voidCells
}

// Elige y construye una forma irregular para el tamaño dado. Si la forma
// resultante no fuera viable (no debería ocurrir: corners/donut lo son por
// construcción y nibble revalida), degrada a tablero clásico.
export function generateShape(rng, size) {
  const cfg = IRREGULAR[size]
  if (!cfg) return { kind: 'classic', voidCells: new Set() }
  const kind = pick(rng, cfg.kinds)
  let voidCells
  if (kind === 'corners') voidCells = cornersShape(rng, size, cfg.maxVoid)
  else if (kind === 'donut') voidCells = donutShape(rng, size, cfg.donutHole)
  else voidCells = nibbleShape(rng, size, cfg.maxVoid)
  if (voidCells.size === 0 || !shapeIsViable(size, voidCells)) {
    return { kind: 'classic', voidCells: new Set() }
  }
  return { kind, voidCells }
}
