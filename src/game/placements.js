// Valida fichas { nombre: { row, col } } recibidas de fuera (código
// compartido, partida guardada) contra un puzzle recién regenerado: descarta
// posiciones no ocupables o duplicadas sin romper la partida.

import { isOccupiable } from './mapGenerator.js'

const castOf = (puzzle) => new Set([...puzzle.characters.suspects, puzzle.characters.victim])

// Valida los testimonios descartados: se queda con los nombres del reparto.
export function filterValidStruckClues(raw, puzzle) {
  if (!Array.isArray(raw)) return []
  const names = castOf(puzzle)
  return raw.filter((name) => names.has(name))
}

// Valida las anotaciones del jugador ({ 'fila,col': [nombre] }): descarta las
// entradas malformadas y los nombres que no pertenecen al reparto del caso.
export function filterValidMarks(raw, puzzle) {
  const names = castOf(puzzle)
  const marks = {}
  for (const [key, list] of Object.entries(raw || {})) {
    if (!Array.isArray(list)) continue
    const valid = list.filter((name) => names.has(name))
    if (valid.length > 0) marks[key] = valid
  }
  return marks
}

export function filterValidPlacements(raw, puzzle) {
  const taken = new Set()
  const placements = {}
  for (const [name, p] of Object.entries(raw || {})) {
    if (!p || typeof p.row !== 'number' || typeof p.col !== 'number') continue
    const key = `${p.row},${p.col}`
    if (!isOccupiable(puzzle.map, p.row, p.col) || taken.has(key)) continue
    taken.add(key)
    placements[name] = { row: p.row, col: p.col }
  }
  return placements
}
