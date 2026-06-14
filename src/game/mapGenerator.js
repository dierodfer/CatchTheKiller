// Generación local del mapa (sección 11 del documento).
// Orden: cuadrícula -> habitaciones irregulares -> mobiliario -> ventanas -> validación.

import { BLOCKING_FURNITURE, ROOM_NAMES, ADJACENT } from './constants.js'
import { randInt, pick, shuffle } from './random.js'

const WALL_BY_BORDER = (size) => (r, c) => {
  if (r === 0) return 'norte'
  if (r === size - 1) return 'sur'
  if (c === 0) return 'oeste'
  if (c === size - 1) return 'este'
  return null
}

// Particiona la cuadrícula en habitaciones irregulares contiguas mediante
// expansión multi-fuente (BFS con frontera barajada).
function partitionRooms(rng, size, numRooms) {
  const total = size * size
  const owner = new Array(total).fill(-1)
  const idx = (r, c) => r * size + c

  // Semillas únicas.
  const allCells = []
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) allCells.push([r, c])
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
            if (owner[idx(nr, nc)] !== -1) {
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

export function generateMap(rng, config) {
  const { gridSize: size, numCharacters, blockingRange } = config
  const numRooms = randInt(rng, size - 2, size - 1)

  let attempt = 0
  while (attempt++ < 200) {
    const rooms = partitionRooms(rng, size, numRooms)
    const grid = Array.from({ length: size }, () => new Array(size).fill(null))
    const windows = []

    const interiorCells = []
    const borderCells = []
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const isBorder = r === 0 || c === 0 || r === size - 1 || c === size - 1
        if (isBorder) borderCells.push([r, c])
        interiorCells.push([r, c])
      }
    }

    // Mobiliario bloqueante.
    const numBlocking = randInt(rng, blockingRange[0], blockingRange[1])
    const blockingCells = shuffle(rng, interiorCells).slice(0, numBlocking)
    for (const [r, c] of blockingCells) {
      grid[r][c] = pick(rng, BLOCKING_FURNITURE)
    }

    // Mobiliario libre (silla) sobre celdas aún libres.
    const stillFree = []
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) if (grid[r][c] === null) stillFree.push([r, c])
    const shuffledFree = shuffle(rng, stillFree)
    const numChairs = randInt(rng, 1, 2)
    for (let i = 0; i < numChairs && i < shuffledFree.length; i++) {
      const [r, c] = shuffledFree[i]
      grid[r][c] = 'silla'
    }

    // Alfombra: una región rectangular contigua de 2 a 6 celdas, sin cruzar
    // entre habitaciones.
    placeRug(rng, grid, size, rooms)

    // Ventanas sobre celdas de borde libres (ahora son ocupables).
    const wallOf = WALL_BY_BORDER(size)
    const freeBorder = shuffle(rng, borderCells).filter(([r, c]) => grid[r][c] === null)
    const numWindows = randInt(rng, 1, 2)
    for (let i = 0; i < numWindows && i < freeBorder.length; i++) {
      const [r, c] = freeBorder[i]
      windows.push({ row: r, col: c, wall: wallOf(r, c) })
    }

    const map = { gridSize: size, rooms, grid, windows }

    // Validación: celdas ocupables >= numCharacters, con holgura.
    const free = freeCells(map)
    if (free.length >= numCharacters + 2) {
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

// Las ventanas son ocupables: un personaje (incluido el asesino) puede estar
// junto a la pared, frente a la ventana.
export function isOccupiable(map, r, c) {
  const v = map.grid[r][c]
  return v === null || v === 'silla' || v === 'alfombra'
}

// Coloca una alfombra rectangular (2 a 6 celdas) sobre celdas libres de una
// misma habitación, probando formas y posiciones al azar hasta encontrar un
// hueco que encaje sin cruzar entre habitaciones.
function placeRug(rng, grid, size, rooms) {
  const roomOf = {}
  rooms.forEach((room, i) => {
    for (const [r, c] of room.cells) roomOf[`${r},${c}`] = i
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
      const room0 = roomOf[`${r0},${c0}`]
      for (let dr = 0; dr < h && fits; dr++) {
        for (let dc = 0; dc < w && fits; dc++) {
          const r = r0 + dr
          const c = c0 + dc
          if (grid[r][c] !== null) fits = false
          if (roomOf[`${r},${c}`] !== room0) fits = false
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
    for (const [r, c] of room.cells) lookup[`${r},${c}`] = room.name
  }
  return lookup
}
