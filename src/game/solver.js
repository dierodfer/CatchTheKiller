// El Solver (secciones 6.4 y 7 del documento) — autoridad final local.
//
// Responsabilidades implementadas:
//   - Verificar unicidad de la solución dada un conjunto de pistas
//   - Validar la solución del jugador
//   - Identificar automáticamente al asesino
//   - Detectar pistas redundantes (para minimizar el conjunto)

import { freeCells } from './mapGenerator.js'
import { evalClue, buildClueContext } from './clues.js'
import { identifyKiller, findKillers } from './killerRule.js'

// Participantes de una pista: el sujeto más los personajes referenciados.
function participants(clue) {
  const parts = [clue.subject]
  const p = clue.params || {}
  for (const key of ['other', 'x', 'y']) {
    if (p[key]) parts.push(p[key])
  }
  return parts
}

function isUnarySatisfiable(clue, cell, ctx) {
  // Solo aplicable a pistas unarias (un único participante).
  const pos = { row: cell[0], col: cell[1] }
  const placements = { [clue.subject]: pos }
  return evalClue(clue, placements, ctx)
}

// Enumera asignaciones completas consistentes con TODAS las pistas.
// Se detiene al alcanzar `limit` soluciones (2 basta para decidir unicidad).
export function solve(map, characters, clues, opts = {}) {
  const limit = opts.limit || 2
  const roomLookup = opts.roomLookup
  // La reconstrucción válida exige exactamente un asesino (la regla del
  // asesino forma parte de las restricciones: así el asesino "emerge").
  const requireSingleKiller = opts.requireSingleKiller !== false
  const ctx = buildClueContext(map, roomLookup, characters)
  const cells = freeCells(map)
  const names = [...characters.suspects, characters.victim]

  const cluesBySubject = {}
  for (const clue of clues) {
    ;(cluesBySubject[clue.subject] ||= []).push(clue)
  }

  // Dominio inicial por personaje, filtrado por pistas unarias.
  const domains = {}
  for (const name of names) {
    const unary = (cluesBySubject[name] || []).filter(
      (c) => participants(c).length === 1,
    )
    domains[name] = cells.filter((cell) => unary.every((c) => isUnarySatisfiable(c, cell, ctx)))
  }

  // Pistas que se completan al asignar cada personaje (su último participante).
  const cluesByLastParticipant = {}
  for (const name of names) cluesByLastParticipant[name] = []
  const order = [...names].sort((a, b) => domains[a].length - domains[b].length)
  const orderIndex = {}
  order.forEach((n, i) => (orderIndex[n] = i))
  for (const clue of clues) {
    const parts = participants(clue)
    let last = parts[0]
    for (const p of parts) if (orderIndex[p] > orderIndex[last]) last = p
    cluesByLastParticipant[last].push(clue)
  }

  const solutions = []
  const assigned = {}
  const used = new Set()

  function recurse(i) {
    if (solutions.length >= limit) return
    if (i === order.length) {
      if (
        requireSingleKiller &&
        findKillers(assigned, characters.suspects, characters.victim).length !== 1
      ) {
        return
      }
      solutions.push({ ...assigned })
      return
    }
    const name = order[i]
    for (const [r, c] of domains[name]) {
      const key = `${r},${c}`
      if (used.has(key)) continue
      assigned[name] = { row: r, col: c }
      used.add(key)
      let ok = true
      for (const clue of cluesByLastParticipant[name]) {
        if (!evalClue(clue, assigned, ctx)) {
          ok = false
          break
        }
      }
      if (ok) recurse(i + 1)
      used.delete(key)
      delete assigned[name]
      if (solutions.length >= limit) return
    }
  }

  recurse(0)
  return solutions
}

// ¿El conjunto de pistas produce exactamente una solución?
export function hasUniqueSolution(map, characters, clues, roomLookup) {
  return solve(map, characters, clues, { limit: 2, roomLookup }).length === 1
}

// Detecta si una pista es redundante (la solución sigue siendo única sin ella).
export function isRedundant(map, characters, clues, clue, roomLookup) {
  const without = clues.filter((c) => c !== clue)
  return hasUniqueSolution(map, characters, without, roomLookup)
}

// Valida la colocación del jugador (sección 9, condición de victoria).
// Devuelve { solved, killer, errors } sin revelar la solución correcta.
export function validatePlayerSolution(map, characters, clues, placements, roomLookup) {
  const ctx = buildClueContext(map, roomLookup, characters)
  const allPlaced = [...characters.suspects, characters.victim].every((n) => placements[n])
  if (!allPlaced) {
    return { solved: false, killer: null, complete: false }
  }

  const failedClues = clues.filter((c) => !evalClue(c, placements, ctx))
  const killers = findKillers(placements, characters.suspects, characters.victim)
  const solved = failedClues.length === 0 && killers.length === 1

  return {
    solved,
    complete: true,
    killer: solved ? killers[0] : null,
    // Se expone solo el número de errores, nunca su localización.
    errorCount: failedClues.length,
  }
}

export { identifyKiller }
