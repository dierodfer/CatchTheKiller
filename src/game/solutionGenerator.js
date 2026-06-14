// Generación local de la solución (sección 6.2 del documento).
//
// Asigna cada personaje a una celda libre, designa la víctima y garantiza que
// EXACTAMENTE un sospechoso cumple la condición de asesinato. Sin IA.

import { freeCells } from './mapGenerator.js'
import { findKillers } from './killerRule.js'
import { shuffle, pick } from './random.js'

// characters: { suspects: string[], victim: string }
// Devuelve { placements, killer } o null si no se encontró configuración válida.
export function generateSolution(rng, map, characters) {
  const cells = freeCells(map)
  const { suspects, victim } = characters

  for (let attempt = 0; attempt < 600; attempt++) {
    const shuffled = shuffle(rng, cells)
    const victimCell = shuffled[0]

    // El asesino debe compartir fila o columna con la víctima.
    const killerCandidates = shuffled.filter(
      ([r, c]) =>
        (r === victimCell[0] || c === victimCell[1]) &&
        !(r === victimCell[0] && c === victimCell[1]),
    )
    if (killerCandidates.length === 0) continue
    const killerCell = pick(rng, killerCandidates)

    // El resto de sospechosos fuera de la fila y columna del asesino,
    // para no romper su línea de control.
    const otherCells = shuffled.filter(
      ([r, c]) =>
        r !== killerCell[0] &&
        c !== killerCell[1] &&
        !(r === victimCell[0] && c === victimCell[1]),
    )

    const otherSuspects = suspects.filter((_, i) => i !== 0)
    if (otherCells.length < otherSuspects.length) continue

    const placements = {}
    placements[victim] = { row: victimCell[0], col: victimCell[1] }
    placements[suspects[0]] = { row: killerCell[0], col: killerCell[1] }
    const chosen = shuffle(rng, otherCells).slice(0, otherSuspects.length)
    otherSuspects.forEach((name, i) => {
      placements[name] = { row: chosen[i][0], col: chosen[i][1] }
    })

    // Validar: exactamente un asesino.
    const killers = findKillers(placements, suspects, victim)
    if (killers.length === 1) {
      return { placements, killer: killers[0] }
    }
  }

  return null
}
