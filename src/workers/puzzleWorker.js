// Entrada del Web Worker de generación.
//
// Aquí no hay lógica de juego: la generación sigue viviendo en
// `game/puzzleGenerator.js`, pura y portable (la importa `scripts/testLogic.mjs`
// desde Node, sin Vite ni worker). Este fichero solo traduce mensajes a una
// llamada y devuelve el resultado.
//
// Motivo de existir: `generatePuzzle` es un bucle síncrono de hasta ~2,7 s en
// experto. Ejecutarlo aquí deja el hilo principal libre para pintar el spinner
// de verdad, en vez de congelarlo justo después del primer fotograma.

import { generatePuzzle } from '@/game/puzzleGenerator.js'

self.onmessage = (event) => {
  const { id, difficultyId, seed, irregular } = event.data ?? {}
  try {
    // `seed ?? undefined` para que entre el parámetro por defecto
    // (`randomSeed()`) cuando la petición no trae semilla.
    const puzzle = generatePuzzle(difficultyId, seed ?? undefined, { irregular })
    self.postMessage({ type: 'result', id, puzzle })
  } catch (e) {
    // Error como mensaje explícito, no como excepción del worker: así el texto
    // original sobrevive (ya está en castellano y se muestra tal cual).
    self.postMessage({ type: 'error', id, message: e?.message })
  }
}
