// Paletas de color para personajes y habitaciones.
//
// Tonos "joya en penumbra" dentro del sistema Botanica at Dusk: pastel
// desaturados que conviven sobre el fondo ciruela y se leen bien sobre los
// tintes suaves de las habitaciones.

// Colores distintos por sospechoso (índice estable dentro de la partida).
export const SUSPECT_COLORS = [
  { bg: '#cf93ab', ring: '#e6b6c8', name: 'rosa malva' },
  { bg: '#a98bc9', ring: '#c8b1e2', name: 'amatista' },
  { bg: '#8bb0c9', ring: '#b1d0e2', name: 'azul niebla' },
  { bg: '#9fc08a', ring: '#c1dcae', name: 'sage' },
  { bg: '#cbb487', ring: '#e2d0a9', name: 'arena' },
  { bg: '#cf9d87', ring: '#e6c0ae', name: 'terracota' },
]

// La víctima destaca en dorado cálido (cremoso), no como un color "más".
export const VICTIM_COLOR = { bg: '#e6d2a0', ring: '#f2e4c2', name: 'dorado' }

// Tintes suaves para habitaciones (se ciclan). Lavados translúcidos en la
// familia ciruela/dorado/sage/rosa para mantener la cohesión.
export const ROOM_TINTS = [
  'rgba(203, 163, 92, 0.09)',
  'rgba(164, 182, 130, 0.09)',
  'rgba(207, 147, 171, 0.09)',
  'rgba(169, 139, 201, 0.08)',
  'rgba(139, 176, 201, 0.08)',
  'rgba(216, 166, 115, 0.09)',
  'rgba(210, 160, 164, 0.08)',
  'rgba(159, 192, 138, 0.08)',
  'rgba(226, 201, 143, 0.08)',
  'rgba(116, 82, 122, 0.14)',
]

export function colorForCharacter(name, characters) {
  if (name === characters.victim) return VICTIM_COLOR
  const idx = characters.suspects.indexOf(name)
  return SUSPECT_COLORS[idx % SUSPECT_COLORS.length]
}
