// Generación local del mapa (sección 11 del documento).
// Orden: cuadrícula -> habitaciones irregulares -> mobiliario -> ventanas -> validación.

import { ROOM_NAMES, ADJACENT, GENERATION, cellKey } from './constants.js'
import { BLOCKING_ELEMENTS, FREE_ELEMENTS } from './elements.js'
import { generateShape, computeExteriorVoid, hasPerfectMatching } from './mapShapes.js'
import { randInt, pick, shuffle } from './random.js'

// Particiona las celdas existentes (no void) en habitaciones irregulares
// contiguas mediante expansión multi-fuente (BFS con frontera barajada).
function partitionRooms(rng, size, numRooms, voidCells) {
  const owner = new Array(size * size).fill(-1)
  const idx = (r, c) => r * size + c
  for (const key of voidCells) {
    const [r, c] = key.split(',').map(Number)
    owner[idx(r, c)] = -2 // void: fuera de toda habitación
  }

  // Semillas únicas.
  const allCells = []
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) if (owner[idx(r, c)] === -1) allCells.push([r, c])
  const seeds = shuffle(rng, allCells).slice(0, numRooms)

  let frontier = []
  seeds.forEach(([r, c], region) => {
    owner[idx(r, c)] = region
    frontier.push([r, c, region])
  })

  while (frontier.length) {
    frontier = shuffle(rng, frontier)
    const next = []
    let grew = false
    for (const [r, c, region] of frontier) {
      const dirs = shuffle(rng, ADJACENT)
      for (const [dr, dc] of dirs) {
        const nr = r + dr
        const nc = c + dc
        if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue
        if (owner[idx(nr, nc)] !== -1) continue
        owner[idx(nr, nc)] = region
        next.push([nr, nc, region])
        grew = true
        break // crecemos una celda por paso para mantener formas equilibradas
      }
      next.push([r, c, region])
    }
    frontier = next
    if (!grew && owner.includes(-1)) {
      // Quedan celdas aisladas: asignarlas a un vecino ya asignado.
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (owner[idx(r, c)] !== -1) continue
          for (const [dr, dc] of ADJACENT) {
            const nr = r + dr
            const nc = c + dc
            if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue
            if (owner[idx(nr, nc)] >= 0) {
              owner[idx(r, c)] = owner[idx(nr, nc)]
              break
            }
          }
        }
      }
      break
    }
    if (!owner.includes(-1)) break
  }

  const names = shuffle(rng, ROOM_NAMES).slice(0, numRooms)
  const rooms = names.map((name) => ({ name, cells: [] }))
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const region = owner[idx(r, c)]
      if (region >= 0 && region < rooms.length) rooms[region].cells.push([r, c])
    }
  }
  // Descartar habitaciones vacías (semillas que no crecieron por colisión).
  return rooms.filter((room) => room.cells.length > 0)
}

export function generateMap(rng, config, { irregular = false } = {}) {
  const { gridSize: size, numCharacters, blockingRange } = config
  const numRooms = randInt(rng, size - 2, size - 1)

  let attempt = 0
  while (attempt++ < GENERATION.MAP_ATTEMPTS) {
    // Forma del tablero. En clásico NO se consume rng (guard estricto): la
    // misma seed produce exactamente el mismo puzzle que antes de esta feature.
    const { kind, voidCells } = irregular
      ? generateShape(rng, size)
      : { kind: 'classic', voidCells: new Set() }
    const exteriorVoid = computeExteriorVoid(size, voidCells)
    const isExterior = (r, c) =>
      r < 0 || c < 0 || r >= size || c >= size || exteriorVoid.has(cellKey(r, c))
    // Pared exterior de una celda (misma prioridad que el clásico
    // norte>sur>oeste>este); el hueco de un donut NO cuenta: es patio interior.
    const outerWallOf = (r, c) => {
      if (isExterior(r - 1, c)) return 'norte'
      if (isExterior(r + 1, c)) return 'sur'
      if (isExterior(r, c - 1)) return 'oeste'
      if (isExterior(r, c + 1)) return 'este'
      return null
    }

    const rooms = partitionRooms(rng, size, numRooms, voidCells)
    const grid = Array.from({ length: size }, () => new Array(size).fill(null))
    const windows = []

    const interiorCells = []
    const borderCells = []
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (voidCells.has(cellKey(r, c))) continue
        if (outerWallOf(r, c) !== null) borderCells.push([r, c])
        interiorCells.push([r, c])
      }
    }

    const numBlocking = randInt(rng, blockingRange[0], blockingRange[1])
    const blockingCells = shuffle(rng, interiorCells).slice(0, numBlocking)
    for (const [r, c] of blockingCells) {
      grid[r][c] = pick(rng, BLOCKING_ELEMENTS)
    }

    // Silla y cama sobre celdas que quedaron libres.
    const stillFree = []
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (grid[r][c] === null && !voidCells.has(cellKey(r, c))) stillFree.push([r, c])
    const shuffledFree = shuffle(rng, stillFree)
    const numChairs = randInt(rng, 1, 2)
    for (let i = 0; i < numChairs && i < shuffledFree.length; i++) {
      const [r, c] = shuffledFree[i]
      grid[r][c] = 'silla'
    }
    const numBeds = randInt(rng, 1, 2)
    for (let i = numChairs; i < numChairs + numBeds && i < shuffledFree.length; i++) {
      const [r, c] = shuffledFree[i]
      grid[r][c] = 'cama'
    }

    // Alfombra: una región rectangular contigua de 2 a 6 celdas, sin cruzar
    // entre habitaciones (ni pisar celdas void: no pertenecen a ninguna sala).
    placeRug(rng, grid, size, rooms)

    // Ventanas sobre celdas libres con pared exterior (siguen siendo
    // ocupables). Cuanto mayor el mapa, más ventanas mínimas (entre 2 y 4).
    const freeBorder = shuffle(rng, borderCells).filter(([r, c]) => grid[r][c] === null)
    const minWindows = Math.min(2 + Math.max(0, size - 4), 4)
    const numWindows = randInt(rng, minWindows, 4)
    for (let i = 0; i < numWindows && i < freeBorder.length; i++) {
      const [r, c] = freeBorder[i]
      windows.push({ row: r, col: c, wall: outerWallOf(r, c) })
    }

    const map = { gridSize: size, rooms, grid, windows, voidCells, irregular: !!irregular, shape: kind }

    // Validación: celdas ocupables >= numCharacters con holgura y, solo en
    // irregular, matching perfecto filas→columnas — el solutionGenerator exige
    // una permutación (nadie comparte fila ni columna), y comprobarlo aquí
    // evita quemar sus 3000 intentos en un mapa sin transversal. No se aplica
    // en clásico: alteraría el flujo de reintentos y rompería el determinismo
    // de las seeds existentes.
    const free = freeCells(map)
    if (free.length >= numCharacters + 2 && (!irregular || hasPerfectMatching(free, size))) {
      return map
    }
  }

  throw new Error('No se pudo generar un mapa válido tras múltiples intentos')
}

// Devuelve la lista de celdas ocupables [r, c] de un mapa.
export function freeCells(map) {
  const cells = []
  for (let r = 0; r < map.gridSize; r++) {
    for (let c = 0; c < map.gridSize; c++) {
      if (isOccupiable(map, r, c)) cells.push([r, c])
    }
  }
  return cells
}

// ¿Forma la celda parte del tablero? Falso fuera de rango y en celdas void de
// mapas irregulares.
export function cellExists(map, r, c) {
  if (r < 0 || c < 0 || r >= map.gridSize || c >= map.gridSize) return false
  return !map.voidCells?.has(cellKey(r, c))
}

// Las ventanas son ocupables: un personaje (incluido el asesino) puede estar
// junto a la pared, frente a la ventana.
export function isOccupiable(map, r, c) {
  if (!cellExists(map, r, c)) return false
  const v = map.grid[r][c]
  return v === null || FREE_ELEMENTS.includes(v)
}

// Coloca una alfombra rectangular (2 a 6 celdas) sobre celdas libres de una
// misma habitación, probando formas y posiciones al azar hasta encontrar un
// hueco que encaje sin cruzar entre habitaciones.
function placeRug(rng, grid, size, rooms) {
  const roomOf = {}
  rooms.forEach((room, i) => {
    for (const [r, c] of room.cells) roomOf[cellKey(r, c)] = i
  })

  const shapes = shuffle(rng, [
    [1, 2], [2, 1],
    [1, 3], [3, 1],
    [1, 4], [4, 1],
    [1, 5], [5, 1],
    [1, 6], [6, 1],
    [2, 2], [2, 3], [3, 2],
  ])

  for (const [h, w] of shapes) {
    if (h > size || w > size) continue
    const positions = []
    for (let r = 0; r <= size - h; r++) {
      for (let c = 0; c <= size - w; c++) positions.push([r, c])
    }
    for (const [r0, c0] of shuffle(rng, positions)) {
      let fits = true
      const room0 = roomOf[cellKey(r0, c0)]
      if (room0 === undefined) continue // celda void o sin sala: no anclar aquí
      for (let dr = 0; dr < h && fits; dr++) {
        for (let dc = 0; dc < w && fits; dc++) {
          const r = r0 + dr
          const c = c0 + dc
          if (grid[r][c] !== null) fits = false
          if (roomOf[cellKey(r, c)] !== room0) fits = false
        }
      }
      if (!fits) continue
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) grid[r0 + dr][c0 + dc] = 'alfombra'
      }
      return
    }
  }
}

// Mapa auxiliar celda -> nombre de habitación.
export function buildRoomLookup(map) {
  const lookup = {}
  for (const room of map.rooms) {
    for (const [r, c] of room.cells) lookup[cellKey(r, c)] = room.name
  }
  return lookup
}

// Rectángulo (inclusive) que ocupa la alfombra, o `null` si `placeRug` no
// encontró hueco (el mapa se queda sin alfombra, no es un error). El min/max
// basta porque `placeRug` solo escribe rectángulos sólidos.
export function rugBoundsOf(map) {
  const rows = []
  const cols = []
  for (let r = 0; r < map.gridSize; r++) {
    for (let c = 0; c < map.gridSize; c++) {
      if (map.grid[r][c] === 'alfombra') {
        rows.push(r)
        cols.push(c)
      }
    }
  }
  if (rows.length === 0) return null
  return {
    r0: Math.min(...rows),
    c0: Math.min(...cols),
    r1: Math.max(...rows),
    c1: Math.max(...cols),
  }
}
