// Regla del asesino (sección 4 del documento) — mecánica tipo torre de ajedrez.
//
// El asesino controla toda su fila y toda su columna. El mobiliario NO corta la
// línea de control: solo cuentan los personajes colocados.

// ¿El sospechoso `suspect` cumple la condición de asesinato con la víctima?
// placements: { nombre: { row, col } }
export function isKiller(suspect, placements, suspects, victim) {
  const a = placements[suspect]
  const v = placements[victim]
  if (!a || !v) return false

  // A y V comparten fila o columna.
  const sharesLine = a.row === v.row || a.col === v.col
  if (!sharesLine) return false

  // Ningún otro personaje (≠ A, ≠ V) está en la fila o columna de A.
  for (const name of suspects) {
    if (name === suspect) continue
    const p = placements[name]
    if (!p) continue
    if (p.row === a.row || p.col === a.col) return false
  }
  return true
}

// Devuelve la lista de sospechosos que cumplen la condición de asesinato.
export function findKillers(placements, suspects, victim) {
  return suspects.filter((s) => isKiller(s, placements, suspects, victim))
}

// Identificación automática: debe existir exactamente un asesino válido.
// Devuelve el nombre del asesino o null si no es único.
export function identifyKiller(placements, suspects, victim) {
  const killers = findKillers(placements, suspects, victim)
  return killers.length === 1 ? killers[0] : null
}

// Celdas que forman la línea de control de una posición (fila + columna).
export function controlLineCells(pos, gridSize) {
  const cells = []
  for (let c = 0; c < gridSize; c++) cells.push([pos.row, c])
  for (let r = 0; r < gridSize; r++) if (r !== pos.row) cells.push([r, pos.col])
  return cells
}
