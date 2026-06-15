// Generación local de la solución (sección 6.2 del documento).
//
// Coloca cada personaje en su propia fila y columna (nadie comparte línea con
// nadie), garantizando que EXACTAMENTE un sospechoso queda a solas con la
// víctima en su habitación (el asesino). Sin IA.

import { isOccupiable } from './mapGenerator.js'
import { findKillers } from './killerRule.js'
import { buildClueContext } from './clues.js'
import { GENERATION, cellKey } from './constants.js'
import { shuffle } from './random.js'

// characters: { suspects: string[], victim: string }
// Devuelve { placements, killer } o null si no se encontró configuración válida.
export function generateSolution(rng, map, characters, roomLookup) {
  const { suspects, victim } = characters
  const size = map.gridSize
  const ctx = buildClueContext(map, roomLookup, characters)
  const roomAt = (r, c) => roomLookup[cellKey(r, c)]
  const rows = Array.from({ length: size }, (_, i) => i)

  for (let attempt = 0; attempt < GENERATION.SOLUTION_ATTEMPTS; attempt++) {
    // Permutación fila -> columna: cada personaje en fila y columna propias.
    const colOrder = shuffle(rng, rows)
    if (!rows.every((r) => isOccupiable(map, r, colOrder[r]))) continue
    const positions = rows.map((r) => [r, colOrder[r]])

    // Agrupar posiciones por habitación; el asesino emerge de la única
    // habitación que acaba con exactamente 2 personajes (víctima + asesino).
    const byRoom = new Map()
    positions.forEach(([r, c], i) => {
      const room = roomAt(r, c)
      if (!byRoom.has(room)) byRoom.set(room, [])
      byRoom.get(room).push(i)
    })
    const pairRooms = shuffle(rng, [...byRoom.values()].filter((idxs) => idxs.length === 2))
    if (pairRooms.length === 0) continue

    const [victimIdx, killerIdx] = shuffle(rng, pairRooms[0])
    const remaining = shuffle(
      rng,
      positions.map((_, i) => i).filter((i) => i !== victimIdx && i !== killerIdx),
    )

    const shuffledSuspects = shuffle(rng, suspects)
    const killer = shuffledSuspects[0]
    const otherSuspects = shuffledSuspects.slice(1)

    const placements = {}
    placements[victim] = { row: positions[victimIdx][0], col: positions[victimIdx][1] }
    placements[killer] = { row: positions[killerIdx][0], col: positions[killerIdx][1] }
    otherSuspects.forEach((name, i) => {
      const [r, c] = positions[remaining[i]]
      placements[name] = { row: r, col: c }
    })

    const killers = findKillers(placements, suspects, victim, ctx)
    if (killers.length === 1 && killers[0] === killer) {
      return { placements, killer }
    }
  }

  return null
}
