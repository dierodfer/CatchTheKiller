// Smoke test de la lógica de generación (sin UI, sin red).
// Genera varios puzzles por dificultad y verifica invariantes (sección 10).

import { generatePuzzle } from '../src/game/puzzleGenerator.js'
import { solve, validatePlayerSolution } from '../src/game/solver.js'
import { freeCells, isOccupiable } from '../src/game/mapGenerator.js'
import { findKillers } from '../src/game/killerRule.js'

const difficulties = ['facil', 'media', 'dificil', 'experto']
const perDifficulty = 8
let failures = 0

function assert(cond, msg) {
  if (!cond) {
    failures++
    console.error('  ✗', msg)
  }
}

for (const diff of difficulties) {
  console.log(`\n=== Dificultad: ${diff} ===`)
  let totalMs = 0
  for (let i = 0; i < perDifficulty; i++) {
    const seed = 1000 * (difficulties.indexOf(diff) + 1) + i
    const t0 = Date.now()
    let puzzle
    try {
      puzzle = generatePuzzle(diff, seed)
    } catch (e) {
      failures++
      console.error(`  ✗ seed ${seed}: ${e.message}`)
      continue
    }
    const ms = Date.now() - t0
    totalMs += ms

    const { map, characters, clues, solution, killer, roomLookup } = puzzle

    // Invariante: cada sospechoso tiene al menos una pista (agrupadas en la UI
    // como una única "pista" por personaje), la víctima 0.
    for (const s of characters.suspects) {
      assert(
        clues.some((c) => c.subject === s),
        `seed ${seed}: ${s} tiene al menos una pista`,
      )
    }
    assert(
      clues.every((c) => c.subject !== characters.victim),
      `seed ${seed}: la víctima no tiene pista`,
    )

    // Invariante: ningún personaje en celda no ocupable, sin solapes.
    const seen = new Set()
    for (const name of [...characters.suspects, characters.victim]) {
      const p = solution[name]
      assert(isOccupiable(map, p.row, p.col), `seed ${seed}: ${name} en celda ocupable`)
      const key = `${p.row},${p.col}`
      assert(!seen.has(key), `seed ${seed}: sin solapamientos (${name})`)
      seen.add(key)
    }

    // Invariante: exactamente un asesino.
    const killers = findKillers(solution, characters.suspects, characters.victim)
    assert(killers.length === 1 && killers[0] === killer, `seed ${seed}: exactamente 1 asesino`)

    // Invariante: solución única.
    const sols = solve(map, characters, clues, { limit: 2, roomLookup })
    assert(sols.length === 1, `seed ${seed}: solución única (encontradas ${sols.length})`)

    // Invariante: la solución conocida valida y revela al asesino correcto.
    const res = validatePlayerSolution(map, characters, clues, solution, roomLookup)
    assert(res.solved && res.killer === killer, `seed ${seed}: validación de la solución`)

    // Holgura: celdas libres >= nº personajes.
    assert(freeCells(map).length >= characters.suspects.length + 1, `seed ${seed}: celdas libres`)

    console.log(
      `  ✓ seed ${seed}: ${map.gridSize}×${map.gridSize}, ${map.rooms.length} hab., ` +
        `asesino=${killer}, ${ms}ms`,
    )
  }
  console.log(`  media ${(totalMs / perDifficulty).toFixed(0)}ms/puzzle`)
}

console.log(`\n${failures === 0 ? '✅ TODO OK' : `❌ ${failures} fallos`}`)
process.exit(failures === 0 ? 0 : 1)
