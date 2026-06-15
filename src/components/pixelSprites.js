// Datos de sprites "pixel art" (rejillas 8×8 + paletas) usados por
// pixelArt.jsx, Furniture.jsx y Cell.jsx. Separado de los componentes para
// que ese módulo solo exporte componentes (Fast Refresh).

// Retrato de sospechoso: cara redondeada con el color del personaje.
export const FACE_GRID = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 3, 2, 2, 3, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
]

// Retrato de la víctima: calavera (mismo contorno, cuencas y dientes oscuros).
export const SKULL_GRID = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 3, 2, 2, 3, 2, 1],
  [1, 2, 2, 3, 3, 2, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [0, 1, 3, 1, 1, 3, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
]

export const AVATAR_OUTLINE = '#1e1322'

// Mobiliario: sprites 8×8 con paleta propia (tonos del sistema Botanica).
const MESA_GRID = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 2, 0, 0, 2, 0, 0],
  [0, 0, 2, 0, 0, 2, 0, 0],
  [0, 0, 2, 0, 0, 2, 0, 0],
  [0, 0, 2, 0, 0, 2, 0, 0],
]

const TV_GRID = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 0, 0, 0, 0, 1, 0],
]

const PLANTA_GRID = [
  [0, 1, 0, 0, 0, 0, 1, 0],
  [1, 2, 1, 0, 0, 1, 2, 1],
  [0, 1, 2, 1, 1, 2, 1, 0],
  [0, 0, 1, 2, 2, 1, 0, 0],
  [0, 0, 0, 3, 3, 0, 0, 0],
  [0, 0, 3, 3, 3, 3, 0, 0],
  [0, 3, 3, 3, 3, 3, 3, 0],
  [0, 3, 3, 3, 3, 3, 3, 0],
]

const SILLA_GRID = [
  [1, 1, 1, 1, 1, 1, 1, 0],
  [1, 2, 2, 2, 2, 2, 1, 0],
  [1, 2, 0, 0, 0, 2, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 2, 2],
  [0, 0, 0, 0, 0, 0, 2, 2],
  [0, 2, 0, 0, 0, 0, 2, 0],
  [0, 2, 0, 0, 0, 0, 2, 0],
]

export const FURNITURE_SPRITES = {
  mesa: { grid: MESA_GRID, palette: { 1: '#cba35c', 2: '#432c48' } },
  TV: { grid: TV_GRID, palette: { 1: '#321f37', 2: '#5a3d5f', 3: '#8bb0c9' } },
  planta: { grid: PLANTA_GRID, palette: { 1: '#7d9162', 2: '#a4b682', 3: '#cf9d87' } },
  silla: { grid: SILLA_GRID, palette: { 1: '#a07d3c', 2: '#432c48' } },
}

// Ventana: 4 cristales con marco en `currentColor` (heredado del acento de zona).
export const WINDOW_GRID = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 1, 1, 2, 2, 1],
  [1, 2, 2, 1, 1, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 1, 1, 2, 2, 1],
  [1, 2, 2, 1, 1, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
]

export const WINDOW_PALETTE = { 1: 'currentColor', 2: '#fbf6ee' }

// Marca de línea de control: aspa de píxeles muy tenue.
export const PIXEL_X_GRID = [
  [1, 0, 0, 0, 0, 0, 0, 1],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [1, 0, 0, 0, 0, 0, 0, 1],
]

export const PIXEL_X_PALETTE = { 1: 'rgba(30,19,34,0.16)' }

// Velo de baldosas en damero, superpuesto sobre el tinte de cada habitación
// para dar textura de "suelo pixelado". `backgroundSize` se fija por celda
// (un cuarto del tamaño de celda = 2×2 baldosas visibles).
export const PIXEL_FLOOR_PATTERN =
  'repeating-conic-gradient(rgba(255,255,255,0.4) 0% 25%, rgba(39,24,41,0.05) 0% 50%)'
