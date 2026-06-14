// Regla del asesino — basada en habitaciones.
//
// El asesino es el ÚNICO sospechoso que se queda A SOLAS con la víctima en una
// misma habitación (solo ellos dos en esa sala). Además, NINGÚN personaje
// comparte fila ni columna con otro: todas las líneas quedan despejadas para
// todos los actores (no solo el asesino y la víctima). Así el asesino "emerge"
// al reconstruir la escena.

// placements: { nombre: { row, col } }; ctx aporta `roomAt(r, c)`.
const roomOf = (ctx, p) => ctx.roomAt(p.row, p.col)

// ¿Todos los personajes ocupan fila y columna distintas entre sí?
function allLinesClear(placements, names) {
  const rows = new Set()
  const cols = new Set()
  for (const name of names) {
    const p = placements[name]
    if (!p) return false
    if (rows.has(p.row) || cols.has(p.col)) return false
    rows.add(p.row)
    cols.add(p.col)
  }
  return true
}

// ¿El sospechoso `suspect` es el asesino dado el reparto completo?
export function isKiller(suspect, placements, suspects, victim, ctx) {
  const a = placements[suspect]
  const v = placements[victim]
  if (!a || !v) return false

  // A y V en la misma habitación...
  if (roomOf(ctx, a) !== roomOf(ctx, v)) return false

  // ...y a solas: ningún otro sospechoso en la habitación de la víctima.
  for (const name of suspects) {
    if (name === suspect) continue
    const p = placements[name]
    if (p && roomOf(ctx, p) === roomOf(ctx, v)) return false
  }
  return true
}

// Devuelve la lista de sospechosos que cumplen la condición de asesinato.
// Si algún personaje comparte fila o columna con otro, nadie puede ser el
// asesino: la escena no está despejada.
export function findKillers(placements, suspects, victim, ctx) {
  if (!allLinesClear(placements, [...suspects, victim])) return []
  return suspects.filter((s) => isKiller(s, placements, suspects, victim, ctx))
}

// Identificación automática: debe existir exactamente un asesino válido.
// Devuelve el nombre del asesino o null si no es único.
export function identifyKiller(placements, suspects, victim, ctx) {
  const killers = findKillers(placements, suspects, victim, ctx)
  return killers.length === 1 ? killers[0] : null
}

// Celdas que forman la línea (fila + columna) de una posición. Se usa para
// resaltar visualmente que las líneas del asesino y la víctima están despejadas.
export function controlLineCells(pos, gridSize) {
  const cells = []
  for (let c = 0; c < gridSize; c++) cells.push([pos.row, c])
  for (let r = 0; r < gridSize; r++) if (r !== pos.row) cells.push([r, pos.col])
  return cells
}
