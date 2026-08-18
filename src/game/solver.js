// El Solver (secciones 6.4 y 7 del documento) — autoridad final local.
//
// Responsabilidades implementadas:
//   - Verificar unicidad de la solución dada un conjunto de pistas
//   - Validar la solución del jugador
//   - Identificar automáticamente al asesino
//   - Detectar pistas redundantes (para minimizar el conjunto)

import { freeCells } from './mapGenerator.js'
import { evalClue, buildClueContext } from './clues.js'
import { findKillers } from './killerRule.js'

// Número de bits a 1 (peso de Hamming). Cuenta las celdas viables de una
// máscara de columnas dentro del bucle más caliente de la búsqueda.
function popcount(x) {
  let n = x - ((x >> 1) & 0x55555555)
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
  n = (n + (n >> 4)) & 0x0f0f0f0f
  return (n * 0x01010101) >> 24
}

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
  const pos = { row: cell[0], col: cell[1] }
  const placements = { [clue.subject]: pos }
  return evalClue(clue, placements, ctx)
}

// Enumera asignaciones completas consistentes con TODAS las pistas.
// Se detiene al alcanzar `limit` soluciones (2 basta para decidir unicidad).
//
// Búsqueda con backtracking, comprobación hacia delante y orden dinámico:
//   - dominio inicial por personaje, filtrado por sus pistas unarias;
//   - la regla del asesino (nadie comparte fila ni columna con nadie) forma
//     parte de las restricciones, así que cada asignación descarta una fila y
//     una columna enteras para todos los pendientes;
//   - en cada nodo se ramifica por el personaje con MENOS celdas viables, y si
//     alguno se queda sin ninguna se poda la rama entera.
//
// El dominio de cada personaje se guarda como una máscara de columnas por fila,
// de modo que las celdas viables de un pendiente salen de un AND con las
// columnas libres: es lo que hace factibles el 8×8 y el 9×9, donde recorrer
// celda a celda el dominio de cada pendiente en cada nodo se lleva casi todo el
// tiempo de generación. El orden dinámico tampoco altera el resultado: el
// número de soluciones no depende del orden de exploración.
export function solve(map, characters, clues, opts = {}) {
  const limit = opts.limit || 2
  const roomLookup = opts.roomLookup
  const ctx = buildClueContext(map, roomLookup, characters)
  const size = map.gridSize
  const cells = freeCells(map)
  const names = [...characters.suspects, characters.victim]

  const cluesBySubject = {}
  for (const clue of clues) {
    cluesBySubject[clue.subject] ||= []
    cluesBySubject[clue.subject].push(clue)
  }

  // Dominio inicial por personaje, filtrado por pistas unarias y aplanado a
  // una máscara de columnas por fila.
  const domains = names.map((name) => {
    const unary = (cluesBySubject[name] || []).filter((c) => participants(c).length === 1)
    const mask = new Int32Array(size)
    for (const cell of cells) {
      if (unary.every((c) => isUnarySatisfiable(c, cell, ctx))) mask[cell[0]] |= 1 << cell[1]
    }
    return mask
  })

  // Pistas de varios participantes: se comprueban en cuanto el último de ellos
  // recibe celda. Las unarias no entran aquí — ya están aplicadas al dominio.
  const multi = []
  for (const clue of clues) {
    const parts = [...new Set(participants(clue))]
    if (parts.length > 1) multi.push({ clue, parts })
  }
  const pending = multi.map((m) => m.parts.length)
  const touchedBy = names.map(() => [])
  multi.forEach((m, i) => {
    for (const p of m.parts) touchedBy[names.indexOf(p)].push(i)
  })

  // `assigned` es el objeto que ven las pistas y la regla del asesino. Su celda
  // por personaje se reutiliza (se mutan row/col), así que las soluciones se
  // copian a fondo al guardarlas.
  const assigned = {}
  const slots = names.map(() => ({ row: 0, col: 0 }))
  const solutions = []
  // Filas y columnas aún sin ocupante, como máscara de bits (un tablero cabe de
  // sobra en 32: el mayor es de 9×9).
  const fullLines = (1 << size) - 1
  let freeRows = fullLines
  let freeCols = fullLines

  // Hay tantos personajes como filas (`numCharacters === gridSize` en todas las
  // dificultades) y ninguno comparte línea con otro: entonces cada fila y cada
  // columna alojan a EXACTAMENTE uno. Eso permite podar también "por el otro
  // lado" — si a una fila libre no le queda ningún candidato pendiente, la rama
  // está muerta aunque a todos los personajes les sobren celdas. Si algún día se
  // rompiera esa igualdad, la poda se desactiva sola y la búsqueda sigue siendo
  // correcta, solo que más lenta.
  const linesAreBijective = names.length === size

  // Regla del asesino en la hoja de la búsqueda. Equivale a
  // `findKillers(...).length === 1`, pero sin rehacer en cada hoja lo que la
  // propia búsqueda ya garantiza: aquí nadie comparte fila ni columna por
  // construcción, así que basta contar cuántos sospechosos acompañan a la
  // víctima en su sala. La versión general de `killerRule` se sigue usando
  // fuera del bucle caliente (validación del jugador, identificación final).
  const suspectNames = characters.suspects
  const victimName = characters.victim
  function exactlyOneKiller() {
    const v = assigned[victimName]
    const victimRoom = ctx.roomAt(v.row, v.col)
    let together = 0
    for (const s of suspectNames) {
      const p = assigned[s]
      if (ctx.roomAt(p.row, p.col) === victimRoom && ++together > 1) return false
    }
    return together === 1
  }

  function snapshot() {
    const out = {}
    for (const name of names) {
      const p = assigned[name]
      out[name] = { row: p.row, col: p.col }
    }
    return out
  }

  function recurse(pendingMask) {
    if (solutions.length >= limit) return
    if (pendingMask === 0) {
      if (exactlyOneKiller()) solutions.push(snapshot())
      return
    }

    // Comprobación hacia delante + orden dinámico en una sola pasada: se cuenta
    // cuántas celdas viables le quedan a cada pendiente; si a alguno no le
    // queda ninguna la rama muere, y si no, se ramifica por el más acotado. De
    // paso se anotan las filas y columnas que alguien pendiente aún alcanza.
    let pick = -1
    let pickCount = Infinity
    let reachableRows = 0
    let reachableCols = 0
    for (let mask = pendingMask; mask !== 0; mask &= mask - 1) {
      const i = 31 - Math.clz32(mask & -mask)
      const dom = domains[i]
      let count = 0
      for (let rows = freeRows; rows !== 0; rows &= rows - 1) {
        const r = 31 - Math.clz32(rows & -rows)
        const cols = dom[r] & freeCols
        if (cols === 0) continue
        count += popcount(cols)
        reachableRows |= 1 << r
        reachableCols |= cols
      }
      if (count === 0) return
      if (count < pickCount) {
        pickCount = count
        pick = i
      }
    }

    // Poda por líneas: toda fila/columna aún libre necesita ocupante.
    if (linesAreBijective && (reachableRows !== freeRows || reachableCols !== freeCols)) return

    const name = names[pick]
    const pos = slots[pick]
    const dom = domains[pick]
    const touched = touchedBy[pick]
    const rest = pendingMask & ~(1 << pick)
    assigned[name] = pos

    for (let rows = freeRows; rows !== 0; rows &= rows - 1) {
      const r = 31 - Math.clz32(rows & -rows)
      for (let cols = dom[r] & freeCols; cols !== 0; cols &= cols - 1) {
        const c = 31 - Math.clz32(cols & -cols)

        pos.row = r
        pos.col = c
        freeRows &= ~(1 << r)
        freeCols &= ~(1 << c)

        for (const i of touched) pending[i]--
        let ok = true
        for (const i of touched) {
          if (pending[i] === 0 && !evalClue(multi[i].clue, assigned, ctx)) {
            ok = false
            break
          }
        }
        if (ok) recurse(rest)
        for (const i of touched) pending[i]++

        freeRows |= 1 << r
        freeCols |= 1 << c
        if (solutions.length >= limit) {
          delete assigned[name]
          return
        }
      }
    }
    delete assigned[name]
  }

  recurse((1 << names.length) - 1)
  return solutions
}

// ¿El conjunto de pistas produce exactamente una solución?
export function hasUniqueSolution(map, characters, clues, roomLookup) {
  return solve(map, characters, clues, { limit: 2, roomLookup }).length === 1
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
  const killers = findKillers(placements, characters.suspects, characters.victim, ctx)
  const solved = failedClues.length === 0 && killers.length === 1
  const v = placements[characters.victim]

  return {
    solved,
    complete: true,
    killer: solved ? killers[0] : null,
    room: solved ? ctx.roomAt(v.row, v.col) : null,
    // Se expone solo el número de errores, nunca su localización.
    errorCount: failedClues.length,
  }
}

export { identifyKiller } from './killerRule.js'
