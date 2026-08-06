// Smoke test de la lógica de generación (sin UI, sin red).
// Genera varios puzzles por dificultad y verifica invariantes (sección 10).

import { generatePuzzle } from '../src/game/puzzleGenerator.js'
import { solve, validatePlayerSolution } from '../src/game/solver.js'
import { freeCells, isOccupiable, cellExists } from '../src/game/mapGenerator.js'
import { findKillers, controlLineCells } from '../src/game/killerRule.js'
import { buildClueContext, evalClue, clueId } from '../src/game/clues.js'
import { pickNextHint } from '../src/game/hints.js'
import { hasPerfectMatching, shapeIsViable, computeExteriorVoid } from '../src/game/mapShapes.js'
import { IRREGULAR, cellKey } from '../src/game/constants.js'
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

// Media de tiempos por (dificultad, modo) para vigilar el coste del irregular.
const avgMs = {}

for (const irregular of [false, true]) {
for (const diff of difficulties) {
  console.log(`\n=== Dificultad: ${diff}${irregular ? ' (irregular)' : ''} ===`)
  let totalMs = 0
  for (let i = 0; i < perDifficulty; i++) {
    // Seeds distintas por modo para muestrear formas variadas.
    const seed = 1000 * (difficulties.indexOf(diff) + 1) + i + (irregular ? 7000 : 0)
    const t0 = Date.now()
    let puzzle
    try {
      puzzle = generatePuzzle(diff, seed, { irregular })
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
    const mainIds = new Set(clues.map(clueId))
    for (const ec of extraClues) {
      assert(!mainIds.has(clueId(ec)), `seed ${seed}: pista extra no duplica principal`)
      assert(
        evalClue(ec, solution, ctx),
        `seed ${seed}: pista extra verdadera (${ec.text})`,
      )
    }

    // Invariante: el pool de extras cubre a TODOS los personajes. Es lo que
    // permite que la pista concedida hable de quien el jugador necesita.
    for (const name of allNames) {
      assert(
        extraClues.some((ec) => ec.subject === name),
        `seed ${seed}: el pool de extras cubre a ${name}`,
      )
    }
    assert(
      extraClues.length >= puzzle.extraClueBudget,
      `seed ${seed}: pool de extras (${extraClues.length}) cubre el presupuesto (${puzzle.extraClueBudget})`,
    )

    // La pista concedida depende del tablero: primero personajes sin colocar,
    // después mal colocados, y solo si no queda nadie, cualquiera.
    {
      const needy = allNames[0]
      // (1) Tablero con todos colocados bien salvo `needy`, sin colocar.
      const partial = { ...solution }
      delete partial[needy]
      const h1 = pickNextHint({ extraClues, revealedIds: [], placements: partial, solution })
      assert(h1?.subject === needy, `seed ${seed}: pista para el no colocado (${needy})`)

      // (2) Todos colocados, `needy` en la celda de otro → mal colocado.
      const other = allNames[1]
      const wrong = { ...solution, [needy]: { ...solution[other] } }
      const h2 = pickNextHint({ extraClues, revealedIds: [], placements: wrong, solution })
      assert(h2?.subject === needy, `seed ${seed}: pista para el mal colocado (${needy})`)

      // (3) Solución completa y correcta: se concede igualmente una pista (no
      // delatar que el tablero ya está bien antes de pulsar "Resolver").
      const h3 = pickNextHint({ extraClues, revealedIds: [], placements: solution, solution })
      assert(h3 !== null, `seed ${seed}: pista de reserva con el tablero correcto`)

      // (4) Pool agotado: sin candidatas, devuelve null.
      const h4 = pickNextHint({
        extraClues,
        revealedIds: extraClues.map(clueId),
        placements: {},
        solution,
      })
      assert(h4 === null, `seed ${seed}: sin extras pendientes devuelve null`)
    }

    // Invariante: en el set completo (principales + extras) no hay pistas
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

    // ── Invariantes de mapas irregulares ─────────────────────────────────
    const size = map.gridSize
    const voidCells = map.voidCells ?? new Set()
    if (!irregular) {
      assert(voidCells.size === 0, `seed ${seed}: clásico sin celdas void`)
    } else {
      // Void disjunto de habitaciones, roomLookup, freeCells y solución
      // (solución ya cubierta por isOccupiable arriba; se re-asserta el resto).
      for (const room of map.rooms) {
        for (const [r, c] of room.cells) {
          assert(!voidCells.has(cellKey(r, c)), `seed ${seed}: celda void en sala ${room.name}`)
        }
      }
      for (const key of voidCells) {
        assert(!(key in roomLookup), `seed ${seed}: celda void en roomLookup (${key})`)
      }

      // Presupuesto de la forma, conectividad y matching sobre existentes.
      assert(
        voidCells.size > 0 && voidCells.size <= IRREGULAR[size].maxVoid,
        `seed ${seed}: nº de void (${voidCells.size}) dentro del presupuesto`,
      )
      assert(shapeIsViable(size, voidCells), `seed ${seed}: forma conexa y con transversal`)

      // Toda fila y columna con ≥1 ocupable + matching perfecto sobre ocupables
      // (la garantía que necesita la permutación del solutionGenerator).
      const free = freeCells(map)
      const rowsWith = new Set(free.map(([r]) => r))
      const colsWith = new Set(free.map(([, c]) => c))
      assert(rowsWith.size === size, `seed ${seed}: toda fila tiene celda ocupable`)
      assert(colsWith.size === size, `seed ${seed}: toda columna tiene celda ocupable`)
      assert(hasPerfectMatching(free, size), `seed ${seed}: matching perfecto sobre ocupables`)

      // Ventanas: nunca en void y siempre con su pared hacia el exterior
      // (el hueco de un donut es patio interior: sin ventanas hacia él).
      const exteriorVoid = computeExteriorVoid(size, voidCells)
      const sideExt = (r, c) =>
        r < 0 || c < 0 || r >= size || c >= size || exteriorVoid.has(cellKey(r, c))
      const WALL_DELTA = { norte: [-1, 0], sur: [1, 0], oeste: [0, -1], este: [0, 1] }
      for (const w of map.windows) {
        assert(!voidCells.has(cellKey(w.row, w.col)), `seed ${seed}: ventana en celda void`)
        const [dr, dc] = WALL_DELTA[w.wall]
        assert(
          sideExt(w.row + dr, w.col + dc),
          `seed ${seed}: ventana en ${w.row},${w.col} con pared ${w.wall} que no da al exterior`,
        )
      }

      // La línea de control nunca pisa huecos.
      for (const name of allNames) {
        for (const [r, c] of controlLineCells(solution[name], map)) {
          assert(cellExists(map, r, c), `seed ${seed}: línea de control sobre void (${r},${c})`)
        }
      }
    }

    // Borde: en clásico la definición por lados exteriores debe coincidir con la
    // fórmula de índice histórica (retrocompatibilidad).
    if (!irregular) {
      for (const [r, c] of freeCells(map)) {
        const oldBorder = r === 0 || c === 0 || r === size - 1 || c === size - 1
        assert(ctx.isBorderCell(r, c) === oldBorder, `seed ${seed}: borde clásico en ${r},${c}`)
      }
    }

    // Esquina: SIEMPRE uno de los cuatro vértices del tablero (y como máximo
    // cuatro), en clásico y en irregular. Un recorte puede quitar vértices, pero
    // nunca puede ascender a esquina una celda que no lo sea.
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const isVertex = (r === 0 || r === size - 1) && (c === 0 || c === size - 1)
        assert(
          ctx.isCornerCell(r, c) === (isVertex && cellExists(map, r, c)),
          `seed ${seed}: esquina mal clasificada en ${r},${c}`,
        )
      }
    }
    assert(ctx.cornerCount <= 4, `seed ${seed}: ${ctx.cornerCount} esquinas (máximo 4)`)
    assert(
      irregular || ctx.cornerCount === 4,
      `seed ${seed}: tablero clásico con ${ctx.cornerCount} esquinas`,
    )

    const shapeInfo = irregular ? ` (${map.shape}, ${voidCells.size} void)` : ''
    console.log(
      `  ✓ seed ${seed}: ${map.gridSize}×${map.gridSize}${shapeInfo}, ` +
        `${map.rooms.length} hab., asesino=${killer}, extras=${extraClues.length}, ${ms}ms`,
    )
  }
  const avg = totalMs / perDifficulty
  avgMs[`${diff}${irregular ? ':irregular' : ':clasico'}`] = avg
  console.log(`  media ${avg.toFixed(0)}ms/puzzle`)
}
}

// Vigilancia de coste: el modo irregular no debería multiplicar los tiempos.
for (const diff of difficulties) {
  const cls = avgMs[`${diff}:clasico`]
  const irr = avgMs[`${diff}:irregular`]
  if (cls > 30 && irr > cls * 3) {
    console.warn(`  ⚠ ${diff} irregular tarda ${(irr / cls).toFixed(1)}× el clásico (${irr.toFixed(0)}ms)`)
  }
}

// Regresión de determinismo clásico: seeds fijadas deben producir siempre el
// mismo caso. Si esto falla, un cambio ha alterado el consumo de rng en modo
// clásico y TODAS las partidas/códigos compartidos previos cambiarían.
{
  const FIXED = { facil: [7, 'Sofía'], media: [12345, 'Bruno'], dificil: [999999, 'Carla'], experto: [3000, 'Rubén'] }
  for (const [diff, [seed, expected]] of Object.entries(FIXED)) {
    const got = generatePuzzle(diff, seed).killer
    assert(got === expected, `determinismo clásico ${diff}:${seed} — asesino ${got}, esperado ${expected}`)
  }
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
      const sortedEntries = (o) =>
        JSON.stringify(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)))
      assert(
        sortedEntries(back) === sortedEntries(partial),
        `sharecode ${difficultyId}/${irregular}/${seed}: fichas → índices → fichas`,
      )

      // Roundtrip integral: regenerar desde lo decodificado da el mismo caso.
      const p2 = generatePuzzle(dec.difficultyId, dec.seed, { irregular: dec.irregular })
      const sortedKeys = (cells) => JSON.stringify([...cells].sort((a, b) => a.localeCompare(b)))
      assert(
        p2.killer === p.killer &&
          JSON.stringify(p2.solution) === JSON.stringify(p.solution) &&
          sortedKeys(p2.map.voidCells) === sortedKeys(p.map.voidCells),
        `sharecode ${difficultyId}/${irregular}/${seed}: puzzle regenerado idéntico`,
      )
    }
  }
}

// Tolerancia de entrada: guiones, minúsculas y caracteres ambiguos (O/I/L).
{
  const code = encodeShareCode({ difficultyId: 'media', seed: 987654321, irregular: true })
  const messy = code.toLowerCase().replaceAll('0', 'o').replaceAll('1', 'i')
  const dec = decodeShareCode(messy)
  assert(
    dec.seed === 987654321 && dec.difficultyId === 'media' && dec.irregular === true,
    'sharecode: tolera minúsculas, guiones y O/I/L',
  )
}

// Malformados: error legible (ShareCodeError), nunca un crash ni un falso OK.
{
  const good = encodeShareCode({ difficultyId: 'experto', seed: 42 }).replaceAll('-', '')
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

const verdict = failures === 0 ? '✅ TODO OK' : `❌ ${failures} fallos`
console.log(`\n${verdict}`)
process.exit(failures === 0 ? 0 : 1)
