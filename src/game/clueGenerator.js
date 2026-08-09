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

import { CLUE_TYPES, evalClue, buildClueContext, clueId } from './clues.js'
import { GENERATION } from './constants.js'
import { PROXIMITY_ELEMENTS, ON_ELEMENTS, ELEMENT_IDS } from './elements.js'
import { solve } from './solver.js'
import { freeCells } from './mapGenerator.js'
import { shuffle, pick, weightedPick } from './random.js'

// Peso de cada tipo al SEMBRAR la pista inicial de un sujeto (elige un tipo al
// azar ponderado, luego una instancia de ese tipo): así ningún tipo abundante
// —antes siempre `inRoom`— acapara las semillas por pura cantidad.
//
// Peso 0 = nunca como semilla, solo como refuerzo en `addUntilUnique`. Es el
// caso de toda pista relacional/direccional: el Solver solo poda el dominio
// inicial con pistas UNARIAS, así que sembrar con una relacional lo dejaría
// sin acotar y dispararía el coste en mapas grandes. Los tipos no listados
// usan peso 1.
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
// estaba en la columna 3"): se permite como máximo una en el puzzle completo
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

// Pistas direccionales: si A ya dice "estoy al norte/sur/izquierda/derecha de B",
// B no puede decir nada direccional sobre A — sería redundante (la relación es
// simétrica: si A está al norte de B, B está al sur de A).
const DIRECTIONAL_KINDS = new Set(['rowAbove', 'rowBelow', 'colLeft', 'colRight'])

function directionalDuplicate(cand, chosen) {
  if (!DIRECTIONAL_KINDS.has(cand.kind)) return false
  const other = cand.params?.other
  if (!other) return false
  return chosen.some(
    (c) => DIRECTIONAL_KINDS.has(c.kind) && c.subject === other && c.params?.other === cand.subject,
  )
}

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

function candidatesFor(subject, solution, characters, ctx, allowedTiers, rng) {
  const pos = solution[subject]
  const out = []
  const allowed = (kind) => allowedTiers.includes(CLUE_TYPES[kind].tier)
  // Un sospechoso nunca referencia a la víctima —sería spoiler de quién es el
  // asesino— y la víctima solo recibe pistas unarias, sobre su propia celda.
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

  if (isVictim || myRoom !== victimRoom) add('inRoom', { room: myRoom })
  for (const room of shuffle(rng, ctx.rooms).slice(0, 2)) {
    if (room !== myRoom) add('notInRoom', { room })
  }
  add('noSuspectInRoom', {})
  for (const o of others) {
    add('withInRoom', { other: o })
    add('notWithInRoom', { other: o })
  }

  for (const id of PROXIMITY_ELEMENTS) add('nextToElement', { element: id })
  add('notNextToMueble', {})
  add('nextToWindow', {})
  for (const id of ON_ELEMENTS) add('onElement', { element: id })

  add('roomSize', { size: 'grande' })
  add('roomSize', { size: 'pequeña' })
  // "Más de 1 cama", "menos de 2 plantas". Sin alfombra: ocupa varias celdas
  // pero es UNA sola, y contar celdas daría una cifra falsa.
  for (const id of ELEMENT_IDS) {
    if (id === 'alfombra') continue
    add('roomElementCount', { element: id, op: 'masDe', value: 1 })
    add('roomElementCount', { element: id, op: 'masDe', value: 2 })
    add('roomElementCount', { element: id, op: 'menosDe', value: 2 })
    add('roomElementCount', { element: id, op: 'menosDe', value: 3 })
  }
  add('roomWindowCount', { count: ctx.roomWindows(myRoom) })

  add('inRow', { row: pos.row })
  add('inColumn', { col: pos.col })
  for (let r = 0; r < size; r++) if (r !== pos.row) add('notInRow', { row: r })
  for (let c = 0; c < size; c++) if (c !== pos.col) add('notInColumn', { col: c })
  add('inCorner', {})
  add('notInCorner', {})
  add('inBorder', {})
  add('notInBorder', {})

  // Nadie comparte fila ni columna con nadie (regla del asesino), así que las
  // cuatro direcciones cardinales son comparaciones válidas.
  for (const o of others) {
    add('rowAbove', { other: o })
    add('rowBelow', { other: o })
    add('colLeft', { other: o })
    add('colRight', { other: o })
  }

  return out
}

// ¿Puede esta candidata entrar en el conjunto? Reúne los cinco descartes
// baratos —ya elegida, cupo del sujeto agotado, cupo de fila/columna agotado,
// redundante por eje o recíproca de una direccional ya presente— para no
// pagar el Solver con una candidata que se iba a descartar igualmente.
function isEligible(cand, { chosen, chosenIds, limit, rowColCapped, countForSubject }) {
  if (chosenIds.has(clueId(cand))) return false
  if (countForSubject(cand.subject) >= limit) return false
  if (rowColCapped && ROWCOL_KINDS.has(cand.kind)) return false
  return !axisRedundant(cand, chosen) && !directionalDuplicate(cand, chosen)
}

// La mejor pista de refuerzo de una muestra: la primera que logra unicidad o,
// si ninguna la logra, la que deja menos soluciones vivas. Devuelve `null` si
// ninguna candidata elegible aporta nada.
function bestReinforcement(state) {
  const { rng, all, chosen, count, kindUsage } = state
  let bestCount = Infinity
  let ties = []

  for (const cand of shuffle(rng, all).slice(0, GENERATION.CANDIDATE_SAMPLE)) {
    if (!isEligible(cand, state)) continue
    chosen.push(cand)
    const c = count(chosen, GENERATION.SOLUTION_PROBE_CAP)
    chosen.pop()
    if (c < 1) continue
    if (c === 1) return cand
    if (c < bestCount) {
      bestCount = c
      ties = [cand]
    } else if (c === bestCount) {
      ties.push(cand)
    }
  }

  if (ties.length === 0) return null
  // Entre las igual de constriñentes, prefiere el tipo de pista menos usado
  // hasta ahora: así el refuerzo aporta variedad, no más `inRoom`.
  return ties.reduce((a, b) => (kindUsage(b) < kindUsage(a) ? b : a), ties[0])
}

// Añade pistas hasta que el Solver confirme unicidad, probando cada tope de
// `limits` en orden. `guard` acota los intentos: si no se logra dentro de
// `maxAdds`, se sale y el orquestador reintenta con otro mapa/solución.
function addUntilUnique(limits, state) {
  const { chosen, chosenIds, count, rowColCount, maxAdds } = state
  let guard = 0
  while (count(chosen, 2) !== 1 && guard++ < maxAdds) {
    const rowColCapped = rowColCount() >= GENERATION.MAX_ROWCOL_CLUES
    let best = null
    for (const limit of limits) {
      best = bestReinforcement({ ...state, limit, rowColCapped })
      if (best) break
    }
    if (!best) break
    chosen.push(best)
    chosenIds.add(clueId(best))
  }
}

// Pistas de reserva de UN sujeto: verdaderas, fuera del set principal y que
// aporten información nueva respecto a lo ya elegido (incluidas las extras que
// se acaban de tomar para este mismo sujeto). Marca en `takenIds` las que toma.
function extrasForSubject(rng, pool, takenIds, context) {
  const out = []
  for (const cand of shuffle(rng, pool)) {
    if (out.length >= GENERATION.EXTRAS_PER_SUBJECT) break
    if (takenIds.has(clueId(cand))) continue
    const seen = context.concat(out)
    if (axisRedundant(cand, seen) || directionalDuplicate(cand, seen)) continue
    out.push(cand)
    takenIds.add(clueId(cand))
  }
  return out
}

// `zoneId` fija la ambientación con la que se redactan las pistas: aquí es donde
// "silla" pasa a ser "banco" en la casa de montaña. Solo afecta al texto.
export function generateClues(rng, map, characters, solution, roomLookup, difficulty, zoneId) {
  const ctx = buildClueContext(map, roomLookup, characters, zoneId)
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

  const countForSubject = (subject) => chosen.filter((c) => c.subject === subject).length
  const kindUsage = (cand) => chosen.reduce((n, c) => n + (c.kind === cand.kind ? 1 : 0), 0)

  const state = {
    rng,
    all,
    chosen,
    chosenIds,
    count,
    countForSubject,
    kindUsage,
    rowColCount,
    maxAdds: characters.suspects.length * 2 + 4,
  }

  // 3. Añadir pistas hasta lograr unicidad, máximo 2 por sujeto: si no se
  // logra dentro de ese límite, se descarta este mapa/solución y el
  // orquestador reintenta con otro.
  addUntilUnique([GENERATION.MAX_CLUES_PER_SUBJECT], state)

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

  // 5. Pool de pistas extra: verdaderas, redundantes con las principales, que
  // el jugador puede solicitar a petición (presupuesto en `difficulty.extraClues`).
  // Sujeto a sujeto y no como pool global, porque `hints.js` elige la pista
  // según qué personaje concreto lleva el jugador sin colocar o mal colocado.
  // Cada candidata se comprueba contra las principales Y contra las extras ya
  // elegidas, o dos extras podrían acabar siendo recíprocas entre sí.
  const chosenFinalIds = new Set(clues.map(clueId))
  const extras = []
  for (const s of subjects) {
    extras.push(...extrasForSubject(rng, pools[s], chosenFinalIds, clues.concat(extras)))
  }
  const extraClues = sortAlpha(extras)

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
