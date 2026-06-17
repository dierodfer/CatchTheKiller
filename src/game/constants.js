// Catálogo central de constantes del juego.

// Mobiliario que bloquea la celda: ningún personaje puede colocarse encima.
export const BLOCKING_FURNITURE = ['mesa', 'TV', 'planta', 'estantería']

// Mobiliario "libre": un personaje puede ocupar la celda igualmente.
export const FREE_FURNITURE = ['silla', 'alfombra', 'cama']

// Conjunto completo de mobiliario interior.
export const FURNITURE = [...BLOCKING_FURNITURE, ...FREE_FURNITURE]

// Mobiliario candidato para pistas de proximidad ("Estaba junto a una X"):
// solo los 5 muebles de referencia (sin planta ni alfombra en pistas).
export const FURNITURE_FOR_PROXIMITY = ['mesa', 'TV', 'estantería', 'silla', 'cama']

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

// Configuración por dificultad (sección 8 del documento).
export const DIFFICULTIES = {
  facil: {
    id: 'facil',
    label: 'Fácil',
    gridSize: 4,
    numCharacters: 4, // 3 sospechosos + 1 víctima
    blockingRange: [3, 4],
    clueTiers: ['absolute', 'room'],
  },
  media: {
    id: 'media',
    label: 'Media',
    gridSize: 5,
    numCharacters: 5, // 4 sospechosos + 1 víctima
    blockingRange: [5, 7],
    clueTiers: ['absolute', 'room', 'relative'],
  },
  dificil: {
    id: 'dificil',
    label: 'Difícil',
    gridSize: 6,
    numCharacters: 6, // 5 sospechosos + 1 víctima
    blockingRange: [8, 10],
    clueTiers: ['absolute', 'room', 'relative'],
  },
  experto: {
    id: 'experto',
    label: 'Experto',
    gridSize: 7,
    numCharacters: 7, // 6 sospechosos + 1 víctima
    blockingRange: [11, 14],
    clueTiers: ['absolute', 'room', 'relative'],
  },
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
  CANDIDATE_SAMPLE: 48, // candidatas muestreadas por iteración de refuerzo
  MAX_ROWCOL_CLUES: 1, // pistas absolutas de fila/columna por puzzle
}
