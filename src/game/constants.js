// Catálogo central de constantes del juego.

// Mobiliario que bloquea la celda: ningún personaje puede colocarse encima.
export const BLOCKING_FURNITURE = ['mesa', 'TV', 'planta']

// Mobiliario "libre": un personaje puede ocupar la celda igualmente.
export const FREE_FURNITURE = ['silla', 'alfombra']

// Conjunto completo de mobiliario interior.
export const FURNITURE = [...BLOCKING_FURNITURE, ...FREE_FURNITURE]

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
