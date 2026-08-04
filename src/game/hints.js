// Elección de la pista adicional que se concede cuando el jugador la pide.
//
// El pool `extraClues` cubre a todos los personajes (ver clueGenerator.js); lo
// que decide CUÁL se revela es el estado del tablero, no el azar: de poco sirve
// una pista sobre alguien que el jugador ya tiene bien colocado. Prioridad:
//
//   1. Personajes que aún no ha colocado.
//   2. Personajes colocados en una celda que no es la suya.
//   3. Reserva: el resto.
//
// Como el Solver garantiza solución única, "mal colocado" se decide de forma
// exacta comparando la ficha con la solución.

import { clueId } from './clues.js'

const samePos = (a, b) => !!a && !!b && a.row === b.row && a.col === b.col

function subjectPriority(subject, placements, solution) {
  if (!placements[subject]) return 1
  if (!samePos(placements[subject], solution[subject])) return 2
  return 3
}

// Devuelve la siguiente pista extra a revelar, o null si no queda ninguna sin
// revelar. El caller es quien controla el presupuesto (`extraClueBudget`).
export function pickNextHint({
  extraClues = [],
  revealedIds = [],
  placements = {},
  solution = {},
}) {
  const revealed = new Set(revealedIds)

  // Cuántas extras lleva ya cada sujeto, para repartir la ayuda en vez de
  // gastarlas todas en el mismo personaje.
  const revealedPerSubject = {}
  const candidates = []
  for (const clue of extraClues) {
    if (revealed.has(clueId(clue))) {
      revealedPerSubject[clue.subject] = (revealedPerSubject[clue.subject] || 0) + 1
    } else {
      candidates.push(clue)
    }
  }
  if (candidates.length === 0) return null

  // El grupo de reserva (prioridad 3) existe a propósito: si el jugador lo
  // tiene todo bien colocado y pide pista, debe recibir una igualmente —
  // negársela delataría que su reconstrucción ya es correcta antes de que
  // pulse "Resolver".
  let best = null
  let bestPriority = Infinity
  let bestRevealed = Infinity
  for (const cand of candidates) {
    const priority = subjectPriority(cand.subject, placements, solution)
    const already = revealedPerSubject[cand.subject] || 0
    // A igualdad de prioridad y de reparto gana la primera del pool: el orden
    // es determinista (viene de la semilla), así que la elección también.
    if (priority < bestPriority || (priority === bestPriority && already < bestRevealed)) {
      best = cand
      bestPriority = priority
      bestRevealed = already
    }
  }
  return best
}
