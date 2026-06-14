// Orquestación de la generación (sección 6 del documento).
// Orden estricto: MAPA -> SOLUCIÓN -> PISTAS -> VALIDACIÓN. Todo local.

import { DIFFICULTIES } from './constants.js'
import { generateMap, buildRoomLookup } from './mapGenerator.js'
import { generateSolution } from './solutionGenerator.js'
import { generateClues } from './clueGenerator.js'
import { hasUniqueSolution, identifyKiller } from './solver.js'
import { buildClueContext } from './clues.js'
import { makeRng, randomSeed } from './random.js'
import { NAMES } from './names.js'
import { shuffle } from './random.js'

// Selecciona `count` nombres con inicial distinta entre sí (incluida la
// víctima), para que ningún personaje se confunda por compartir letra inicial.
function pickDistinctNames(rng, count) {
  const initials = new Set()
  const picked = []
  for (const name of shuffle(rng, NAMES)) {
    const initial = name[0].toLowerCase()
    if (initials.has(initial)) continue
    initials.add(initial)
    picked.push(name)
    if (picked.length === count) break
  }
  return picked
}

const byName = (a, b) => a.localeCompare(b, 'es')

export function generatePuzzle(difficultyId = 'facil', seed = randomSeed()) {
  const difficulty = DIFFICULTIES[difficultyId]
  if (!difficulty) throw new Error(`Dificultad desconocida: ${difficultyId}`)

  const rng = makeRng(seed)

  for (let attempt = 0; attempt < 60; attempt++) {
    // 1. MAPA
    const map = generateMap(rng, difficulty)
    map.difficulty = difficulty.id
    const roomLookup = buildRoomLookup(map)

    // Personajes: N−1 sospechosos + 1 víctima, todos con inicial distinta.
    const names = pickDistinctNames(rng, difficulty.numCharacters)
    if (names.length < difficulty.numCharacters) continue
    const characters = {
      suspects: names.slice(0, difficulty.numCharacters - 1),
      victim: names[difficulty.numCharacters - 1],
    }
    const ctx = buildClueContext(map, roomLookup, characters)

    // 2. SOLUCIÓN
    const solution = generateSolution(rng, map, characters, roomLookup)
    if (!solution) continue

    // 3. PISTAS
    const clues = generateClues(
      rng,
      map,
      characters,
      solution.placements,
      roomLookup,
      difficulty,
    )
    if (!clues) continue

    // 4 + 5. VALIDACIÓN FINAL (autoridad del Solver)
    if (!hasUniqueSolution(map, characters, clues, roomLookup)) continue
    const killer = identifyKiller(solution.placements, characters.suspects, characters.victim, ctx)
    if (killer !== solution.killer) continue

    // Orden alfabético de sospechosos (color y presentación); no afecta a quién
    // es el asesino, que se determina por la regla, no por el orden.
    characters.suspects = [...characters.suspects].sort(byName)

    return {
      seed,
      difficulty: difficulty.id,
      map,
      roomLookup,
      characters,
      clues,
      solution: solution.placements,
      killer,
    }
  }

  throw new Error('No se pudo generar un puzzle válido; reintenta con otra semilla')
}
