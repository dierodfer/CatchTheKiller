// Generación local de pistas (secciones 6.3 y 6.4 del documento).
//
// Estrategia (fiel al flujo del documento):
//   1. Derivar TODAS las pistas verdaderas posibles de la solución.
//   2. Sembrar una pista por sospechoso (ideal de la sección 5.3).
//   3. Mientras el Solver no confirme unicidad, añadir la pista que más reduce
//      la ambigüedad — "solicitar una pista adicional para el sospechoso más
//      ambiguo" (sección 6.4).
//   4. Minimizar: eliminar pistas redundantes conservando ≥1 por sospechoso.
//
// "La lógica propone, el Solver decide": ningún conjunto se acepta sin pasar la
// verificación de unicidad.

import { CLUE_TYPES, evalClue, buildClueContext } from './clues.js'
import { solve } from './solver.js'
import { shuffle, pick } from './random.js'

const FURNITURE_FOR_PROXIMITY = ['mesa', 'TV', 'planta', 'ventana']

// Orden de preferencia para sembrar pistas iniciales (más específicas primero).
const SEED_PREFERENCE = [
  'inRoom',
  'withInRoom',
  'directionOf',
  'sharesRow',
  'sharesColumn',
  'inRow',
  'inColumn',
  'nextToFurniture',
  'onChair',
  'onRug',
  'rowAbove',
  'rowBelow',
  'inCorner',
  'inBorder',
]

const clueId = (c) => `${c.subject}|${c.kind}|${JSON.stringify(c.params)}`

function makeClue(subject, kind, params, ctx) {
  return { subject, kind, params, text: CLUE_TYPES[kind].text(params, ctx) }
}

// Todas las pistas verdaderas para un sospechoso, según la solución.
function candidatesFor(subject, solution, characters, ctx, allowedTiers, rng) {
  const pos = solution[subject]
  const out = []
  const allowed = (kind) => allowedTiers.includes(CLUE_TYPES[kind].tier)
  const others = [...characters.suspects, characters.victim].filter((n) => n !== subject)
  const myRoom = ctx.roomAt(pos.row, pos.col)
  const size = ctx.gridSize

  const add = (kind, params) => {
    if (!allowed(kind)) return
    const clue = makeClue(subject, kind, params, ctx)
    if (evalClue(clue, solution, ctx)) out.push(clue)
  }

  // Habitación
  add('inRoom', { room: myRoom })
  for (const room of shuffle(rng, ctx.rooms).slice(0, 2)) {
    if (room !== myRoom) add('notInRoom', { room })
  }
  add('aloneInRoom', {})
  for (const o of others) {
    add('withInRoom', { other: o })
    add('notWithInRoom', { other: o })
  }

  // Proximidad a mobiliario
  for (const f of FURNITURE_FOR_PROXIMITY) add('nextToFurniture', { furniture: f })
  add('notNextToFurniture', {})
  add('onChair', {})
  add('onRug', {})

  // Absolutas
  add('inRow', { row: pos.row })
  add('inColumn', { col: pos.col })
  for (let r = 0; r < size; r++) if (r !== pos.row) add('notInRow', { row: r })
  for (let c = 0; c < size; c++) if (c !== pos.col) add('notInColumn', { col: c })
  add('inCorner', {})
  add('notInCorner', {})
  add('inBorder', {})
  add('notInBorder', {})

  // Relativas
  for (const o of others) {
    for (const dir of ['norte', 'sur', 'este', 'oeste']) add('directionOf', { other: o, dir })
    add('rowAbove', { other: o })
    add('rowBelow', { other: o })
    add('sharesRow', { other: o })
    add('notSharesRow', { other: o })
    add('sharesColumn', { other: o })
    add('notSharesColumn', { other: o })
    add('notSharesRowNorColumn', { other: o })
  }

  // Avanzadas
  for (let i = 0; i < others.length; i++) {
    for (let j = i + 1; j < others.length; j++) {
      add('betweenSharesRow', { x: others[i], y: others[j] })
    }
  }

  return out
}

export function generateClues(rng, map, characters, solution, roomLookup, difficulty) {
  const ctx = buildClueContext(map, roomLookup, characters)
  ctx.rooms = map.rooms.map((r) => r.name)
  const tiers = difficulty.clueTiers

  const pools = {}
  const all = []
  for (const s of characters.suspects) {
    const pool = candidatesFor(s, solution, characters, ctx, tiers, rng)
    if (pool.length === 0) return null
    pools[s] = pool
    all.push(...pool)
  }

  const count = (clues, limit) => solve(map, characters, clues, { limit, roomLookup }).length

  // 2. Sembrar una pista por sospechoso (preferentemente específica).
  const chosen = []
  const chosenIds = new Set()
  for (const s of characters.suspects) {
    let seed = null
    for (const kind of SEED_PREFERENCE) {
      const opts = pools[s].filter((c) => c.kind === kind)
      if (opts.length) {
        seed = pick(rng, opts)
        break
      }
    }
    if (!seed) seed = pick(rng, pools[s])
    chosen.push(seed)
    chosenIds.add(clueId(seed))
  }

  // 3. Añadir pistas hasta lograr unicidad.
  const CAP = 14
  const maxAdds = characters.suspects.length * 3 + 6
  let guard = 0
  while (count(chosen, 2) !== 1 && guard++ < maxAdds) {
    let best = null
    let bestCount = Infinity
    for (const cand of shuffle(rng, all).slice(0, 48)) {
      if (chosenIds.has(clueId(cand))) continue
      chosen.push(cand)
      const c = count(chosen, CAP)
      chosen.pop()
      if (c >= 1 && c < bestCount) {
        bestCount = c
        best = cand
        if (c === 1) break
      }
    }
    if (!best) break
    chosen.push(best)
    chosenIds.add(clueId(best))
  }

  if (count(chosen, 2) !== 1) return null

  // 4. Minimizar: eliminar redundantes manteniendo ≥1 pista por sospechoso.
  const minimized = minimize(map, characters, chosen, roomLookup, count)

  // Orden de presentación: por orden de sospechosos, varias pistas agrupadas.
  return characters.suspects.flatMap((s) => minimized.filter((c) => c.subject === s))
}

function minimize(map, characters, clues, roomLookup, count) {
  const result = clues.slice()
  for (const clue of clues) {
    const subjectClues = result.filter((c) => c.subject === clue.subject)
    if (subjectClues.length <= 1) continue // cada sospechoso conserva ≥1
    const without = result.filter((c) => c !== clue)
    if (count(without, 2) === 1) {
      result.splice(result.indexOf(clue), 1)
    }
  }
  return result
}
