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
import { GENERATION } from './constants.js'
import { PROXIMITY_ELEMENTS, ON_ELEMENTS, ELEMENT_IDS } from './elements.js'
import { solve } from './solver.js'
import { freeCells } from './mapGenerator.js'
import { shuffle, pick, weightedPick } from './random.js'

// Peso de cada tipo de pista al SEMBRAR la pista inicial de un sujeto. La
// siembra elige primero un *tipo* (al azar ponderado entre los disponibles) y
// luego una instancia concreta de ese tipo: así las pistas específicas e
// interesantes dominan sin que un único tipo (antes siempre `inRoom`) acapare
// la mayoría de las pistas.
//
// Las semillas son pistas UNARIAS y específicas (acotan la celda del propio
// sujeto). Esto es clave para el rendimiento: el Solver solo poda el dominio
// inicial de cada personaje con pistas unarias, así que sembrar con pistas
// relacionales (withInRoom, direccionales…) dejaría el dominio sin acotar y
// dispararía el coste de generación en mapas grandes.
//
// Las pistas relacionales/direccionales y las débiles/negativas valen 0 aquí
// (no se siembran), pero SÍ aparecen luego como refuerzo en addUntilUnique
// cuando ayudan a la unicidad — de ahí que sigan saliendo en el puzzle final.
// Los tipos no listados usan peso 1.
const SEED_WEIGHT = {
  // Unarias específicas y muy informativas
  inRoom: 5,
  nextToElement: 5,
  onElement: 4,
  nextToWindow: 4,
  // Coordenada absoluta (además sujeta al tope global de fila/columna)
  inRow: 2,
  inColumn: 2,
  // Relacionales/direccionales: nunca como semilla (no acotan el dominio)
  noSuspectInRoom: 0,
  withInRoom: 0,
  notWithInRoom: 0,
  rowAbove: 0,
  rowBelow: 0,
  colLeft: 0,
  colRight: 0,
  // Pistas de habitación (unarias, peso medio)
  roomSize: 3,
  roomElementCount: 3,
  roomWindowCount: 3,
  // Débiles/negativas: nunca como semilla
  notInRoom: 0,
  notNextToMueble: 0,
  inCorner: 0,
  notInCorner: 0,
  inBorder: 0,
  notInBorder: 0,
  notInRow: 0,
  notInColumn: 0,
}

// Pistas de posición absoluta en fila/columna ("Estaba en la fila 2", "No
// estaba en la columna 3"): se permite como máximo una en todo el puzzle
// (GENERATION.MAX_ROWCOL_CLUES) para no saturarlo de coordenadas — las pistas
// de habitación, mobiliario y dirección relativa llevan el peso del razonamiento.
const ROWCOL_KINDS = new Set(['inRow', 'notInRow', 'inColumn', 'notInColumn'])

// Coherencia por eje: un MISMO sujeto no puede llevar a la vez una pista
// absoluta de su columna y una relativa de izquierda/derecha — si ya se conoce
// su columna, decir que está a la izquierda/derecha de otro es redundante y se
// presupone. Igual en vertical: fila absoluta vs norte/sur. (El caso CRUZADO
// —A fija su columna y B dice estar a su izquierda— NO se ve afectado: son
// sujetos distintos, y ahí la dirección sí ayuda a ubicar a B.)
const COL_ABS = new Set(['inColumn', 'notInColumn'])
const COL_REL = new Set(['colLeft', 'colRight'])
const ROW_ABS = new Set(['inRow', 'notInRow'])
const ROW_REL = new Set(['rowAbove', 'rowBelow'])

function axisRedundant(cand, chosen) {
  const same = chosen.filter((c) => c.subject === cand.subject)
  const has = (set) => same.some((c) => set.has(c.kind))
  if (COL_ABS.has(cand.kind) && has(COL_REL)) return true
  if (COL_REL.has(cand.kind) && has(COL_ABS)) return true
  if (ROW_ABS.has(cand.kind) && has(ROW_REL)) return true
  if (ROW_REL.has(cand.kind) && has(ROW_ABS)) return true
  return false
}

const clueId = (c) => `${c.subject}|${c.kind}|${JSON.stringify(c.params)}`

function makeClue(subject, kind, params, ctx) {
  return { subject, kind, params, text: CLUE_TYPES[kind].text(params, ctx) }
}

// Siembra de la pista inicial de un sujeto: elige un tipo al azar ponderado
// (ver SEED_WEIGHT) entre los disponibles en su pool, y luego una instancia
// concreta de ese tipo. Agrupar por tipo evita que los tipos con muchas
// instancias (p. ej. `notInRow`, una por cada fila) salgan favorecidos solo por
// abundancia. `rowColCapped` excluye fila/columna si ya se alcanzó el tope.
function pickSeed(rng, pool, rowColCapped) {
  const byKind = new Map()
  for (const c of pool) {
    if (rowColCapped && ROWCOL_KINDS.has(c.kind)) continue
    if (!byKind.has(c.kind)) byKind.set(c.kind, [])
    byKind.get(c.kind).push(c)
  }
  // Solo quedaban candidatas de fila/columna y están topadas: usa el pool entero.
  if (byKind.size === 0) return pick(rng, pool)
  const kind = weightedPick(rng, [...byKind.keys()], (k) => SEED_WEIGHT[k] ?? 1)
  return pick(rng, byKind.get(kind))
}

// Una pista unaria es "obvia" si se cumple en TODA celda ocupable: no aporta
// información (p. ej. "no estaba en una estantería", donde nadie puede estar).
function isObviousClue(clue, ctx) {
  if (!CLUE_TYPES[clue.kind].unary) return false
  for (const [r, c] of ctx.occupiable) {
    const placements = { [clue.subject]: { row: r, col: c } }
    if (!evalClue(clue, placements, ctx)) return false
  }
  return true
}

// Todas las pistas verdaderas para un sospechoso, según la solución.
function candidatesFor(subject, solution, characters, ctx, allowedTiers, rng) {
  const pos = solution[subject]
  const out = []
  const allowed = (kind) => allowedTiers.includes(CLUE_TYPES[kind].tier)
  // Las pistas de un sospechoso NUNCA referencian a la víctima: la relación
  // espacial con la víctima es justo lo que define al asesino, así que nombrarla
  // sería un spoiler de la solución. La víctima, a su vez, solo recibe pistas
  // unarias (sobre su propia celda): no se relaciona con ningún sospechoso.
  const isVictim = subject === characters.victim
  const others = isVictim ? [] : characters.suspects.filter((n) => n !== subject)
  const myRoom = ctx.roomAt(pos.row, pos.col)
  const size = ctx.gridSize

  // Habitación de la víctima: un sospechoso con inRoom apuntando a ella
  // revelaría directamente al asesino (único en esa sala con la víctima).
  const victimPos = !isVictim ? solution[characters.victim] : null
  const victimRoom = victimPos ? ctx.roomAt(victimPos.row, victimPos.col) : null

  const add = (kind, params) => {
    if (!allowed(kind)) return
    const clue = makeClue(subject, kind, params, ctx)
    if (!evalClue(clue, solution, ctx)) return
    if (isObviousClue(clue, ctx)) return
    out.push(clue)
  }

  // Habitación
  if (isVictim || myRoom !== victimRoom) add('inRoom', { room: myRoom })
  for (const room of shuffle(rng, ctx.rooms).slice(0, 2)) {
    if (room !== myRoom) add('notInRoom', { room })
  }
  add('noSuspectInRoom', {})
  for (const o of others) {
    add('withInRoom', { other: o })
    add('notWithInRoom', { other: o })
  }

  // Proximidad a elementos del mapa
  for (const id of PROXIMITY_ELEMENTS) add('nextToElement', { element: id })
  add('notNextToMueble', {})
  add('nextToWindow', {})
  for (const id of ON_ELEMENTS) add('onElement', { element: id })

  // Propiedades de la habitación
  add('roomSize', { size: 'grande' })
  add('roomSize', { size: 'pequeña' })
  // Conteo ambiguo por elemento ("más de 1 cama", "menos de 2 plantas"). La
  // alfombra se excluye: ocupa varias celdas pero es UNA sola, así que contar
  // celdas daría cifras engañosas. add()/isObviousClue descartan las cotas que
  // no discriminan (verdaderas en toda sala).
  for (const id of ELEMENT_IDS) {
    if (id === 'alfombra') continue
    add('roomElementCount', { element: id, op: 'masDe', value: 1 })
    add('roomElementCount', { element: id, op: 'masDe', value: 2 })
    add('roomElementCount', { element: id, op: 'menosDe', value: 2 })
    add('roomElementCount', { element: id, op: 'menosDe', value: 3 })
  }
  add('roomWindowCount', { count: ctx.roomWindows(myRoom) })

  // Absolutas
  add('inRow', { row: pos.row })
  add('inColumn', { col: pos.col })
  for (let r = 0; r < size; r++) if (r !== pos.row) add('notInRow', { row: r })
  for (let c = 0; c < size; c++) if (c !== pos.col) add('notInColumn', { col: c })
  add('inCorner', {})
  add('notInCorner', {})
  add('inBorder', {})
  add('notInBorder', {})

  // Relativas. Nadie comparte fila ni columna con nadie (regla del asesino),
  // así que las cuatro direcciones cardinales son comparaciones válidas.
  for (const o of others) {
    add('rowAbove', { other: o })
    add('rowBelow', { other: o })
    add('colLeft', { other: o })
    add('colRight', { other: o })
  }

  return out
}

export function generateClues(rng, map, characters, solution, roomLookup, difficulty) {
  const ctx = buildClueContext(map, roomLookup, characters)
  ctx.rooms = map.rooms.map((r) => r.name)
  ctx.occupiable = freeCells(map)
  const tiers = difficulty.clueTiers

  // Sujetos con pista propia: todos los sospechosos y también la víctima (con
  // pistas unarias), para que su celda sea deducible sin que nadie la referencie.
  const subjects = [...characters.suspects, characters.victim]

  const pools = {}
  const all = []
  for (const s of subjects) {
    const pool = candidatesFor(s, solution, characters, ctx, tiers, rng)
    if (pool.length === 0) return null
    pools[s] = pool
    all.push(...pool)
  }

  const count = (clues, limit) => solve(map, characters, clues, { limit, roomLookup }).length

  // 2. Sembrar una pista por sujeto (tipo elegido al azar ponderado).
  const chosen = []
  const chosenIds = new Set()
  const rowColCount = () => chosen.filter((c) => ROWCOL_KINDS.has(c.kind)).length
  for (const s of shuffle(rng, subjects)) {
    const seed = pickSeed(rng, pools[s], rowColCount() >= GENERATION.MAX_ROWCOL_CLUES)
    chosen.push(seed)
    chosenIds.add(clueId(seed))
  }

  // 3. Añadir pistas hasta lograr unicidad. El máximo es de 2 pistas por
  // sujeto: si no se logra unicidad dentro de ese límite, se descarta este
  // mapa/solución y el orquestador reintenta con otro.
  const { SOLUTION_PROBE_CAP: CAP, MAX_CLUES_PER_SUBJECT, CANDIDATE_SAMPLE } = GENERATION
  const countForSubject = (subject) => chosen.filter((c) => c.subject === subject).length
  const maxAdds = characters.suspects.length * 2 + 4

  // Cuántas pistas de cada tipo se han elegido ya (para diversificar el refuerzo).
  const kindUsage = (cand) => chosen.reduce((n, c) => n + (c.kind === cand.kind ? 1 : 0), 0)

  const addUntilUnique = (limits) => {
    let guard = 0
    while (count(chosen, 2) !== 1 && guard++ < maxAdds) {
      let best = null
      let bestCount = Infinity
      let ties = [] // candidatas que empatan en bestCount (no unicidad inmediata)
      const rowColCapped = rowColCount() >= GENERATION.MAX_ROWCOL_CLUES
      for (const limit of limits) {
        for (const cand of shuffle(rng, all).slice(0, CANDIDATE_SAMPLE)) {
          if (chosenIds.has(clueId(cand))) continue
          if (countForSubject(cand.subject) >= limit) continue
          if (rowColCapped && ROWCOL_KINDS.has(cand.kind)) continue
          if (axisRedundant(cand, chosen)) continue
          chosen.push(cand)
          const c = count(chosen, CAP)
          chosen.pop()
          if (c < 1) continue
          if (c === 1) {
            // Esta candidata cierra la unicidad: úsala de inmediato.
            best = cand
            ties = []
            break
          }
          if (c < bestCount) {
            bestCount = c
            ties = [cand]
          } else if (c === bestCount) {
            ties.push(cand)
          }
        }
        if (best) break
        // Entre las candidatas igual de constriñentes, prefiere el tipo de pista
        // menos usado hasta ahora: así el refuerzo aporta variedad, no más
        // `inRoom`/`nextToElement`.
        if (ties.length) {
          best = ties.reduce((a, b) => (kindUsage(b) < kindUsage(a) ? b : a))
          break
        }
      }
      if (!best) break
      chosen.push(best)
      chosenIds.add(clueId(best))
    }
  }

  addUntilUnique([MAX_CLUES_PER_SUBJECT])

  if (count(chosen, 2) !== 1) return null

  // 4. Minimizar: eliminar redundantes manteniendo ≥1 pista por sujeto.
  const minimized = minimize(map, characters, chosen, roomLookup, count)

  // Orden de presentación: sujetos alfabéticamente; varias pistas del mismo
  // sujeto se agrupan (consecutivas) en la UI.
  const sortAlpha = (list) => {
    const sa = [...new Set(list.map((c) => c.subject))].sort((a, b) =>
      a.localeCompare(b, 'es'),
    )
    return sa.flatMap((s) => list.filter((c) => c.subject === s))
  }

  const clues = sortAlpha(minimized)

  // 5. Pistas extra de reserva: verdaderas y no incluidas en el set principal,
  // que el jugador puede solicitar a petición. No afectan a la unicidad (son
  // redundantes), pero aportan información adicional para desbloquear.
  const chosenFinalIds = new Set(clues.map(clueId))
  const extraPool = all.filter(
    (c) => !chosenFinalIds.has(clueId(c)) && !axisRedundant(c, clues),
  )
  const numExtra = difficulty.extraClues || 0
  const extraClues = sortAlpha(shuffle(rng, extraPool).slice(0, numExtra))

  return { clues, extraClues }
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
