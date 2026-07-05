// Smoke test de la lógica de generación (sin UI, sin red).
// Genera varios puzzles por dificultad y verifica invariantes (sección 10).

import { generatePuzzle } from '../src/game/puzzleGenerator.js'
import { solve, validatePlayerSolution } from '../src/game/solver.js'
import { freeCells, isOccupiable } from '../src/game/mapGenerator.js'
import { findKillers } from '../src/game/killerRule.js'
import { buildClueContext, evalClue } from '../src/game/clues.js'
import {
  encodeShareCode,
  decodeShareCode,
  placementsToIndices,
  indicesToPlacements,
  ShareCodeError,
} from '../src/game/shareCode.js'

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

    const { map, characters, clues, extraClues, solution, killer, roomLookup } = puzzle

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
    // habitación, y NINGÚN personaje comparte fila ni columna con otro.
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
    const allNames = [...characters.suspects, characters.victim]
    const rowSet = new Set(allNames.map((n) => solution[n].row))
    const colSet = new Set(allNames.map((n) => solution[n].col))
    assert(rowSet.size === allNames.length, `seed ${seed}: filas distintas para todos`)
    assert(colSet.size === allNames.length, `seed ${seed}: columnas distintas para todos`)

    // Invariante: iniciales distintas en todos los personajes (incl. víctima),
    // y la víctima tiene siempre la inicial alfabéticamente mayor.
    const initials = allNames.map((n) => n[0].toLowerCase())
    assert(new Set(initials).size === initials.length, `seed ${seed}: iniciales distintas`)
    const victimInitial = characters.victim[0].toLowerCase()
    const suspectInitials = characters.suspects.map((s) => s[0].toLowerCase())
    assert(
      suspectInitials.every((i) => victimInitial.localeCompare(i, 'es') > 0),
      `seed ${seed}: la víctima tiene la inicial alfabéticamente mayor`,
    )

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

    // Invariante: como máximo 1 pista absoluta de fila/columna por puzzle.
    const rowColClues = clues.filter((c) =>
      ['inRow', 'notInRow', 'inColumn', 'notInColumn'].includes(c.kind),
    )
    assert(
      rowColClues.length <= 1,
      `seed ${seed}: como máximo 1 pista de fila/columna (hay ${rowColClues.length})`,
    )

    // Invariante: una pista "junto a un elemento" nunca se emite si el sujeto
    // está de hecho ENCIMA de ese mismo tipo de elemento (alfombra/silla/cama) —
    // sería engañosa ("estaba sobre la alfombra" ≠ "junto a una alfombra").
    for (const c of clues) {
      if (c.kind !== 'nextToElement') continue
      const p = solution[c.subject]
      assert(
        map.grid[p.row][p.col] !== c.params.element,
        `seed ${seed}: "${c.subject} junto a ${c.params.element}" pero está encima de uno`,
      )
    }

    // Invariante: solución única.
    const sols = solve(map, characters, clues, { limit: 2, roomLookup })
    assert(sols.length === 1, `seed ${seed}: solución única (encontradas ${sols.length})`)

    // Invariante: la solución conocida valida y revela al asesino correcto.
    const res = validatePlayerSolution(map, characters, clues, solution, roomLookup)
    assert(res.solved && res.killer === killer, `seed ${seed}: validación de la solución`)

    // Holgura: celdas libres >= nº personajes.
    assert(freeCells(map).length >= characters.suspects.length + 1, `seed ${seed}: celdas libres`)

    // Invariante: pistas extra son verdaderas y no duplican las principales.
    const mainIds = new Set(clues.map((c) => `${c.subject}|${c.kind}|${JSON.stringify(c.params)}`))
    for (const ec of extraClues) {
      const ecId = `${ec.subject}|${ec.kind}|${JSON.stringify(ec.params)}`
      assert(!mainIds.has(ecId), `seed ${seed}: pista extra no duplica principal`)
      assert(
        evalClue(ec, solution, ctx),
        `seed ${seed}: pista extra verdadera (${ec.text})`,
      )
    }

    // Invariante: en TODO el set (principales + extras) no hay pistas
    // direccionales recíprocas (A→B y B→A) ni, para un mismo sujeto, mezcla de
    // eje absoluto (fila/columna) con el relativo del mismo eje.
    const directional = new Set(['rowAbove', 'rowBelow', 'colLeft', 'colRight'])
    const allClues = [...clues, ...extraClues]
    for (const a of allClues) {
      if (!directional.has(a.kind)) continue
      const reciprocal = allClues.some(
        (b) => directional.has(b.kind) && b.subject === a.params?.other && b.params?.other === a.subject,
      )
      assert(
        !reciprocal,
        `seed ${seed}: pistas direccionales recíprocas entre ${a.subject} y ${a.params?.other}`,
      )
    }
    const colAbs = new Set(['inColumn', 'notInColumn'])
    const colRel = new Set(['colLeft', 'colRight'])
    const rowAbs = new Set(['inRow', 'notInRow'])
    const rowRel = new Set(['rowAbove', 'rowBelow'])
    for (const name of allNames) {
      const kinds = allClues.filter((c) => c.subject === name).map((c) => c.kind)
      const has = (set) => kinds.some((k) => set.has(k))
      assert(
        !(has(colAbs) && has(colRel)) && !(has(rowAbs) && has(rowRel)),
        `seed ${seed}: ${name} mezcla pista absoluta y relativa del mismo eje`,
      )
    }

    console.log(
      `  ✓ seed ${seed}: ${map.gridSize}×${map.gridSize}, ${map.rooms.length} hab., ` +
        `asesino=${killer}, extras=${extraClues.length}, ${ms}ms`,
    )
  }
  console.log(`  media ${(totalMs / perDifficulty).toFixed(0)}ms/puzzle`)
}

// ─── Código compartible: roundtrip, tolerancia y errores ────────────────────

console.log('\n=== Código compartible ===')

// Roundtrip de campos (con y sin fichas, incluidos sentinels parciales).
for (const difficultyId of difficulties) {
  for (const irregular of [false, true]) {
    for (const seed of [0, 1, 0xffffffff, 123456789]) {
      const p = generatePuzzle(difficultyId, seed, { irregular })
      const size = p.map.gridSize

      // Sin fichas.
      const plain = decodeShareCode(encodeShareCode({ difficultyId, seed, irregular }))
      assert(
        plain.difficultyId === difficultyId &&
          plain.seed === seed &&
          plain.irregular === irregular &&
          plain.placementIndices === null,
        `sharecode ${difficultyId}/${irregular}/${seed}: roundtrip sin fichas`,
      )

      // Con fichas parciales: la solución real menos un personaje (sentinel).
      const partial = { ...p.solution }
      delete partial[p.characters.suspects[0]]
      const indices = placementsToIndices(partial, p.characters, size)
      const dec = decodeShareCode(
        encodeShareCode({ difficultyId, seed, irregular, placementIndices: indices }),
      )
      assert(
        JSON.stringify(dec.placementIndices) === JSON.stringify(indices),
        `sharecode ${difficultyId}/${irregular}/${seed}: roundtrip de fichas`,
      )
      const back = indicesToPlacements(dec.placementIndices, p.characters, size)
      const sortedEntries = (o) => JSON.stringify(Object.entries(o).sort())
      assert(
        sortedEntries(back) === sortedEntries(partial),
        `sharecode ${difficultyId}/${irregular}/${seed}: fichas → índices → fichas`,
      )

      // Roundtrip integral: regenerar desde lo decodificado da el mismo caso.
      const p2 = generatePuzzle(dec.difficultyId, dec.seed, { irregular: dec.irregular })
      assert(
        p2.killer === p.killer &&
          JSON.stringify(p2.solution) === JSON.stringify(p.solution) &&
          JSON.stringify([...p2.map.voidCells].sort()) ===
            JSON.stringify([...p.map.voidCells].sort()),
        `sharecode ${difficultyId}/${irregular}/${seed}: puzzle regenerado idéntico`,
      )
    }
  }
}

// Tolerancia de entrada: guiones, minúsculas y caracteres ambiguos (O/I/L).
{
  const code = encodeShareCode({ difficultyId: 'media', seed: 987654321, irregular: true })
  const messy = code.toLowerCase().replace(/0/g, 'o').replace(/1/g, 'i')
  const dec = decodeShareCode(messy)
  assert(
    dec.seed === 987654321 && dec.difficultyId === 'media' && dec.irregular === true,
    'sharecode: tolera minúsculas, guiones y O/I/L',
  )
}

// Malformados: error legible (ShareCodeError), nunca un crash ni un falso OK.
{
  const good = encodeShareCode({ difficultyId: 'experto', seed: 42 }).replace(/-/g, '')
  const mutate = (s, i) => s.slice(0, i) + (s[i] === 'A' ? 'B' : 'A') + s.slice(i + 1)
  const bad = [
    '',
    '2AAAAAAAAA', // versión desconocida
    good.slice(0, 5), // truncado
    mutate(good, 3), // checksum corrupto
    good + 'AAAA', // longitud incorrecta
  ]
  for (const b of bad) {
    let threw = null
    try {
      decodeShareCode(b)
    } catch (e) {
      threw = e
    }
    assert(
      threw instanceof ShareCodeError && typeof threw.message === 'string' && threw.message.length > 5,
      `sharecode: entrada malformada rechazada con mensaje legible (${JSON.stringify(b.slice(0, 12))})`,
    )
  }
}

console.log(failures === 0 ? '  ✓ roundtrip, tolerancia y errores OK' : '  (ver fallos arriba)')

console.log(`\n${failures === 0 ? '✅ TODO OK' : `❌ ${failures} fallos`}`)
process.exit(failures === 0 ? 0 : 1)
