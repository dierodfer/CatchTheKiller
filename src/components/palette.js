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
// familia ciruela/dorado/sage/rosa, con hues bien diferenciados entre sí
// para que cada habitación se distinga sobre el fondo claro del tablero.
export const ROOM_TINTS = [
  'rgba(203, 163, 92, 0.16)', // dorado
  'rgba(125, 145, 98, 0.16)', // sage profundo
  'rgba(207, 147, 171, 0.15)', // rosa malva
  'rgba(169, 139, 201, 0.15)', // amatista
  'rgba(139, 176, 201, 0.15)', // azul niebla
  'rgba(216, 166, 115, 0.17)', // terracota
  'rgba(160, 125, 60, 0.14)', // dorado profundo
  'rgba(159, 192, 138, 0.16)', // sage claro
  'rgba(116, 82, 122, 0.15)', // ciruela suave
  'rgba(185, 122, 128, 0.16)', // rosa profundo
]

export function colorForCharacter(name, characters) {
  if (name === characters.victim) return VICTIM_COLOR
  const idx = characters.suspects.indexOf(name)
  return SUSPECT_COLORS[idx % SUSPECT_COLORS.length]
}
