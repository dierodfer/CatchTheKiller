// Generación local de la solución (sección 6.2 del documento).
//
// Asigna cada personaje a una celda libre garantizando que EXACTAMENTE un
// sospechoso queda a solas con la víctima en su habitación (el asesino), con
// las líneas del asesino y la víctima despejadas. Sin IA.

import { freeCells } from './mapGenerator.js'
import { findKillers } from './killerRule.js'
import { buildClueContext } from './clues.js'
import { shuffle, pick } from './random.js'

// characters: { suspects: string[], victim: string }
// Devuelve { placements, killer } o null si no se encontró configuración válida.
export function generateSolution(rng, map, characters, roomLookup) {
  const cells = freeCells(map)
  const { suspects, victim } = characters
  const ctx = buildClueContext(map, roomLookup, characters)
  const roomAt = (r, c) => roomLookup[`${r},${c}`]

  // El asesino es uno cualquiera de los sospechosos (los nombres son simétricos;
  // la selección aleatoria viene del orden ya barajado de `suspects`).
  const killer = suspects[0]
  const otherSuspects = suspects.slice(1)

  for (let attempt = 0; attempt < 800; attempt++) {
    const shuffled = shuffle(rng, cells)
    const [vr, vc] = shuffled[0]
    const vRoom = roomAt(vr, vc)

    // Asesino: en la habitación de la víctima, en distinta fila y columna.
    const killerCandidates = shuffled.filter(
      ([r, c]) => roomAt(r, c) === vRoom && r !== vr && c !== vc,
    )
    if (killerCandidates.length === 0) continue
    const [kr, kc] = pick(rng, killerCandidates)

    // Resto de sospechosos: fuera de la habitación de la víctima y fuera de las
    // filas/columnas tanto del asesino como de la víctima (pueden compartir
    // línea entre ellos, pero nunca con el asesino o la víctima).
    const otherCells = shuffled.filter(
      ([r, c]) =>
        roomAt(r, c) !== vRoom && r !== vr && c !== vc && r !== kr && c !== kc,
    )
    if (otherCells.length < otherSuspects.length) continue

    const placements = {}
    placements[victim] = { row: vr, col: vc }
    placements[killer] = { row: kr, col: kc }
    const chosen = shuffle(rng, otherCells).slice(0, otherSuspects.length)
    otherSuspects.forEach((name, i) => {
      placements[name] = { row: chosen[i][0], col: chosen[i][1] }
    })

    // Validar: exactamente un asesino, y que sea el esperado.
    const killers = findKillers(placements, suspects, victim, ctx)
    if (killers.length === 1 && killers[0] === killer) {
      return { placements, killer }
    }
  }

  return null
}
