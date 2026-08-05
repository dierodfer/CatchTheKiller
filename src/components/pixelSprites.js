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

export const AVATAR_OUTLINE = '#1e1322'

// Retrato de la víctima: calavera de hueso, no una cara gris. La rejilla es
// 9×9 (no 8×8 como el resto) por un motivo geométrico: con 8 columnas, el
// contorno ocupa las dos exteriores y las cuencas de 2 px quedan pegadas a él,
// fundiéndose en una mancha oscura que ya no lee como calavera. Con ancho
// impar hay columna central para el tabique nasal y queda 1 px de hueso entre
// cada cuenca y el contorno, así que la silueta se mantiene nítida. Se dibuja
// en la misma caja que los demás retratos (el viewBox escala), solo cambia la
// finura del píxel.
//
// Anatomía por filas: bóveda craneal (0-2), cuencas (3-4), nariz y pómulos
// (5), mandíbula (6) y dentadura (7).
export const SKULL_GRID = [
  [0, 0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 5, 5, 5, 5, 2, 1, 0],
  [1, 5, 5, 2, 2, 2, 2, 2, 1],
  [1, 2, 3, 3, 2, 3, 3, 2, 1],
  [1, 2, 3, 3, 2, 3, 3, 2, 1],
  [1, 4, 2, 2, 3, 2, 2, 4, 1],
  [0, 1, 2, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 3, 2, 3, 2, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 0, 0],
]

// 2 hueso · 3 cuenca/nariz/huecos entre dientes · 4 sombra de pómulo ·
// 5 brillo de frente. La luz entra por arriba a la izquierda, igual que en las
// chinchetas del expediente.
export const SKULL_PALETTE = {
  1: AVATAR_OUTLINE,
  2: '#e4d8c6',
  3: AVATAR_OUTLINE,
  4: '#bfb09b',
  5: '#f4ece0',
}

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
