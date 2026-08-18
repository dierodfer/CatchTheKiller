// Catálogo central de constantes del juego.
//
// Los "elementos del mapa" (antes "mobiliario") viven en su propio registro:
// ver `elements.js` (ELEMENTS, BLOCKING_ELEMENTS, FREE_ELEMENTS, etc.).

// Nombres de habitaciones disponibles (sección 11 del documento).
export const ROOM_NAMES = [
  'Salón',
  'Cocina',
  'Dormitorio',
  'Estudio',
  'Pasillo',
  'Biblioteca',
  'Comedor',
  'Terraza',
  'Bodega',
  'Galería',
]

// Artículo definido de cada habitación, para la concordancia de género en las
// pistas ("Estaba en la Cocina", no "en el Cocina").
export const ROOM_ARTICLE = {
  Salón: 'el',
  Cocina: 'la',
  Dormitorio: 'el',
  Estudio: 'el',
  Pasillo: 'el',
  Biblioteca: 'la',
  Comedor: 'el',
  Terraza: 'la',
  Bodega: 'la',
  Galería: 'la',
}

// Frase con artículo de una habitación ya resuelta para su zona: "el Salón",
// "la Alcoba"... `rm` es la tabla que devuelve `resolveRooms` (game/zones.js):
// nombre canónico -> {label, article}. Punto único de indirección para el
// nombre mostrado, igual que `elementPhrase` en elements.js.
export const roomPhrase = (rm, room) => `${rm[room].article} ${rm[room].label}`

// Configuración por dificultad (sección 8 del documento).
//
// Seis rangos de investigador, de menor a mayor. El orden de las claves ES el
// orden que muestra la pantalla de inicio (el selector recorre
// `Object.values`), así que insertar un nivel por en medio lo coloca en su
// sitio sin tocar la UI. `extraClues` es el número de lupas —pistas
// adicionales que el jugador puede pedir— que reparte cada nivel.
export const DIFFICULTIES = {
  novato: {
    id: 'novato',
    label: 'Novato',
    gridSize: 4,
    numCharacters: 4, // 3 sospechosos + 1 víctima
    blockingRange: [3, 4],
    clueTiers: ['absolute', 'room'],
    extraClues: 2,
  },
  aspirante: {
    id: 'aspirante',
    label: 'Aspirante',
    gridSize: 5,
    numCharacters: 5, // 4 sospechosos + 1 víctima
    blockingRange: [5, 7],
    clueTiers: ['absolute', 'room', 'relative'],
    extraClues: 2,
  },
  detective: {
    id: 'detective',
    label: 'Detective',
    gridSize: 6,
    numCharacters: 6, // 5 sospechosos + 1 víctima
    blockingRange: [8, 10],
    clueTiers: ['absolute', 'room', 'relative'],
    extraClues: 3,
  },
  investigador: {
    id: 'investigador',
    label: 'Investigador',
    gridSize: 7,
    numCharacters: 7, // 6 sospechosos + 1 víctima
    blockingRange: [11, 14],
    clueTiers: ['absolute', 'room', 'relative'],
    extraClues: 3,
  },
  experto: {
    id: 'experto',
    label: 'Experto',
    gridSize: 8,
    numCharacters: 8, // 7 sospechosos + 1 víctima
    blockingRange: [15, 18],
    clueTiers: ['absolute', 'room', 'relative'],
    extraClues: 4,
  },
  sherlock: {
    id: 'sherlock',
    label: 'Sherlock',
    gridSize: 9,
    numCharacters: 9, // 8 sospechosos + 1 víctima
    blockingRange: [21, 25],
    clueTiers: ['absolute', 'room', 'relative'],
    extraClues: 4,
    // Nueve personajes en 81 casillas rara vez quedan clavados con dos pistas
    // cada uno: el generador se queda sin margen y descarta el caso entero. Se
    // le permite una tercera pista para quien la necesite (solo cuando con dos
    // no hay ninguna que sirva, ver `addUntilUnique`).
    maxCluesPerSubject: 3,
    // Y se le da a elegir entre más candidatas por ronda: el pool de un 9×9 es
    // enorme, y con la muestra de siempre el refuerzo avanza a tientas y acaba
    // costando más tiempo del que ahorra.
    candidateSample: 96,
  },
}

// Presupuestos de formas irregulares por tamaño de tablero (ver mapShapes.js).
// `kinds`: formas disponibles; `maxVoid`: tope de celdas eliminadas;
// `donutHole`: lado del hueco central. En 4×4 el margen es mínimo (4 personajes
// + 3-4 bloqueantes en 16 celdas), así que solo se recortan esquinas.
export const IRREGULAR = {
  4: { kinds: ['corners'], maxVoid: 2 },
  5: { kinds: ['corners', 'donut', 'nibble'], maxVoid: 3, donutHole: 1 },
  6: { kinds: ['corners', 'donut', 'nibble'], maxVoid: 5, donutHole: 2 },
  7: { kinds: ['corners', 'donut', 'nibble'], maxVoid: 6, donutHole: 2 },
  8: { kinds: ['corners', 'donut', 'nibble'], maxVoid: 8, donutHole: 2 },
  9: { kinds: ['corners', 'donut', 'nibble'], maxVoid: 9, donutHole: 3 },
}

// Direcciones cardinales para adyacencia (4 vecinos).
export const ADJACENT = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
]

// Clave de celda "fila,columna" para índices y conjuntos por posición.
export const cellKey = (r, c) => `${r},${c}`

// Límites de los bucles de generación (reintentos y muestreos). Agrupados aquí
// para poder ajustar el rendimiento/calidad desde un único sitio.
export const GENERATION = {
  PUZZLE_ATTEMPTS: 60, // orquestación completa (puzzleGenerator)
  MAP_ATTEMPTS: 200, // layout válido de mapa (mapGenerator)
  SOLUTION_ATTEMPTS: 3000, // colocación válida de personajes (solutionGenerator)
  SOLUTION_PROBE_CAP: 14, // tope de soluciones al comparar candidatas (clueGenerator)
  MAX_CLUES_PER_SUBJECT: 2, // pistas máximas por sujeto
  EXTRAS_PER_SUBJECT: 2, // pistas de reserva por sujeto en el pool de extras
  CANDIDATE_SAMPLE: 48, // candidatas muestreadas por iteración de refuerzo
  MAX_ROWCOL_CLUES: 1, // pistas absolutas de fila/columna por puzzle
}
