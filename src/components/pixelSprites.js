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

// Retrato de la víctima: mismo encuadre que un sospechoso, pero revelado en
// gris con grano de píxeles — efecto de "foto" sin color, para distinguirla
// de un vistazo sin depender de una forma concreta.
export const VICTIM_GRID = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 4, 2, 2, 4, 1, 0],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 3, 2, 2, 3, 2, 1],
  [1, 4, 2, 2, 2, 2, 4, 1],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [0, 1, 2, 4, 4, 2, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
]

export const AVATAR_OUTLINE = '#1e1322'
export const VICTIM_PALETTE = { 1: AVATAR_OUTLINE, 2: '#9a93a0', 3: AVATAR_OUTLINE, 4: '#6c6571' }

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

// Silla: butaca de frente con respaldo, cojín y reposabrazos.
const SILLA_GRID = [
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [1, 1, 2, 2, 2, 2, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
]

// Cama: vista de perfil con cabecero, almohada y colcha — un personaje puede
// acostarse encima.
const CAMA_GRID = [
  [1, 1, 0, 0, 0, 0, 0, 0],
  [1, 1, 0, 0, 0, 0, 0, 0],
  [1, 1, 2, 2, 0, 0, 0, 0],
  [1, 1, 2, 2, 3, 3, 3, 3],
  [1, 1, 3, 3, 3, 3, 3, 3],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
]

// Estantería: mueble bloqueante (misma función que mesa/TV/planta), con baldas
// y lomos de libros de colores.
const ESTANTERIA_GRID = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 3, 2, 3, 2, 3, 1],
  [1, 2, 3, 2, 3, 2, 3, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 3, 2, 3, 2, 3, 2, 1],
  [1, 3, 2, 3, 2, 3, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 0, 0, 0, 0, 1, 0],
]

export const FURNITURE_SPRITES = {
  mesa: { grid: MESA_GRID, palette: { 1: '#cba35c', 2: '#432c48' } },
  TV: { grid: TV_GRID, palette: { 1: '#321f37', 2: '#5a3d5f', 3: '#8bb0c9' } },
  planta: { grid: PLANTA_GRID, palette: { 1: '#7d9162', 2: '#a4b682', 3: '#cf9d87' } },
  estantería: { grid: ESTANTERIA_GRID, palette: { 1: '#a07d3c', 2: '#5a3d5f', 3: '#7d9162' } },
  silla: { grid: SILLA_GRID, palette: { 1: '#5a3d5f', 2: '#c98f5a' } },
  cama: { grid: CAMA_GRID, palette: { 1: '#a07d3c', 2: '#fbf6ee', 3: '#cf93ab' } },
}

// Marca de línea de control: aspa de píxeles muy tenue.
export const PIXEL_X_GRID = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
]

export const PIXEL_X_PALETTE = { 1: 'rgba(30,19,34,0.10)' }

// Velo de baldosas en damero, superpuesto sobre el tinte de cada habitación
// para dar textura de "suelo pixelado". `backgroundSize` se fija por celda
// (un cuarto del tamaño de celda = 2×2 baldosas visibles).
export const PIXEL_FLOOR_PATTERN =
  'repeating-conic-gradient(rgba(255,255,255,0.4) 0% 25%, rgba(39,24,41,0.05) 0% 50%)'
