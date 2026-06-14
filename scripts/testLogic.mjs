// Smoke test de la lógica de generación (sin UI, sin red).
// Genera varios puzzles por dificultad y verifica invariantes (sección 10).

import { generatePuzzle } from '../src/game/puzzleGenerator.js'
import { solve, validatePlayerSolution } from '../src/game/solver.js'
import { freeCells, isOccupiable } from '../src/game/mapGenerator.js'
import { findKillers } from '../src/game/killerRule.js'
import { buildClueContext } from '../src/game/clues.js'

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
    // como una única "pista" por personaje). La víctima también tiene pistas
    // propias (solo unarias) para poder ubicarla sin que nadie la referencie.
    for (const s of characters.suspects) {
      assert(
        clues.some((c) => c.subject === s),
        `seed ${seed}: ${s} tiene al menos una pista`,
      )
    }
    assert(
      clues.some((c) => c.subject === characters.victim),
      `seed ${seed}: la víctima tiene pista propia`,
    )

    // Invariante (núcleo de la petición): ninguna pista referencia a la víctima.
    const refsVictim = clues.some((c) => {
      const p = c.params || {}
      return [p.other, p.x, p.y].includes(characters.victim)
    })
    assert(!refsVictim, `seed ${seed}: ninguna pista referencia a la víctima`)

    // Invariante: ningún personaje en celda no ocupable, sin solapes.
    const seen = new Set()
    for (const name of [...characters.suspects, characters.victim]) {
      const p = solution[name]
      assert(isOccupiable(map, p.row, p.col), `seed ${seed}: ${name} en celda ocupable`)
      const key = `${p.row},${p.col}`
      assert(!seen.has(key), `seed ${seed}: sin solapamientos (${name})`)
      seen.add(key)
    }

    // Invariante: exactamente un asesino (regla basada en habitaciones).
    const ctx = buildClueContext(map, roomLookup, characters)
    const killers = findKillers(solution, characters.suspects, characters.victim, ctx)
    assert(killers.length === 1 && killers[0] === killer, `seed ${seed}: exactamente 1 asesino`)

    // Invariante (nueva regla): el asesino está a solas con la víctima en su
    // habitación y ni asesino ni víctima comparten fila/columna con nadie más.
    const vp = solution[characters.victim]
    const kp = solution[killer]
    const vRoom = roomLookup[`${vp.row},${vp.col}`]
    assert(
      roomLookup[`${kp.row},${kp.col}`] === vRoom,
      `seed ${seed}: asesino en la habitación de la víctima`,
    )
    const inVictimRoom = characters.suspects.filter(
      (s) => roomLookup[`${solution[s].row},${solution[s].col}`] === vRoom,
    )
    assert(inVictimRoom.length === 1, `seed ${seed}: asesino a solas con la víctima`)
    for (const name of [...characters.suspects, characters.victim]) {
      if (name === killer || name === characters.victim) continue
      const p = solution[name]
      assert(
        p.row !== vp.row && p.col !== vp.col && p.row !== kp.row && p.col !== kp.col,
        `seed ${seed}: líneas de asesino/víctima despejadas (${name})`,
      )
    }

    // Invariante: iniciales distintas en todos los personajes (incl. víctima).
    const initials = [...characters.suspects, characters.victim].map((n) => n[0].toLowerCase())
    assert(new Set(initials).size === initials.length, `seed ${seed}: iniciales distintas`)

    // Invariante: sospechosos y pistas ordenados alfabéticamente.
    const sortedSuspects = [...characters.suspects].sort((a, b) => a.localeCompare(b, 'es'))
    assert(
      characters.suspects.every((s, i) => s === sortedSuspects[i]),
      `seed ${seed}: sospechosos en orden alfabético`,
    )
    const clueSubjects = clues.map((c) => c.subject)
    const distinctInOrder = clueSubjects.filter((s, i) => clueSubjects.indexOf(s) === i)
    const sortedSubjects = [...distinctInOrder].sort((a, b) => a.localeCompare(b, 'es'))
    assert(
      distinctInOrder.every((s, i) => s === sortedSubjects[i]),
      `seed ${seed}: pistas en orden alfabético por sujeto`,
    )

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
