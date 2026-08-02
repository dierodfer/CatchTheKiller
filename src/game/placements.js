// Valida fichas { nombre: { row, col } } recibidas de fuera (código
// compartido, partida guardada) contra un puzzle recién regenerado: descarta
// posiciones no ocupables o duplicadas sin romper la partida.

import { isOccupiable } from './mapGenerator.js'

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
