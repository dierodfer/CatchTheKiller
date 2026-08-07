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
export const DIFFICULTIES = {
  facil: {
    id: 'facil',
    label: 'Fácil',
    gridSize: 4,
    numCharacters: 4, // 3 sospechosos + 1 víctima
    blockingRange: [3, 4],
    clueTiers: ['absolute', 'room'],
    extraClues: 2,
  },
  media: {
    id: 'media',
    label: 'Media',
    gridSize: 5,
    numCharacters: 5, // 4 sospechosos + 1 víctima
    blockingRange: [5, 7],
    clueTiers: ['absolute', 'room', 'relative'],
    extraClues: 2,
  },
  dificil: {
    id: 'dificil',
    label: 'Difícil',
    gridSize: 6,
    numCharacters: 6, // 5 sospechosos + 1 víctima
    blockingRange: [8, 10],
    clueTiers: ['absolute', 'room', 'relative'],
    extraClues: 3,
  },
  experto: {
    id: 'experto',
    label: 'Experto',
    gridSize: 7,
    numCharacters: 7, // 6 sospechosos + 1 víctima
    blockingRange: [11, 14],
    clueTiers: ['absolute', 'room', 'relative'],
    extraClues: 4,
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
}

// Tipos de celda según su ocupabilidad.
export const CELL = {
  FREE: 'free',
  BLOCKED: 'blocked',
  WINDOW: 'window',
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
