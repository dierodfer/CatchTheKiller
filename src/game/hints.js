// Ayuda progresiva (sección 9): revela la posición correcta del primer
// personaje aún mal colocado o sin colocar, según la solución del puzzle.

export function getNextHint(puzzle, placements) {
  const { characters, solution } = puzzle
  const all = [...characters.suspects, characters.victim]
  const target = all.find((name) => {
    const p = placements[name]
    const s = solution[name]
    return !p || p.row !== s.row || p.col !== s.col
  })
  if (!target) return null

  const s = solution[target]
  return {
    name: target,
    row: s.row,
    col: s.col,
    text: `${target} estaba en la fila ${s.row + 1}, columna ${s.col + 1}.`,
  }
}
