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

// La víctima no entra en la rotación de colores: va en ceniza apagada, a juego
// con la calavera de hueso de su retrato. El tono es deliberadamente OSCURO
// porque `bg` cumple dos papeles a la vez — texto sobre crema (nombre en el
// expediente) y relleno bajo texto blanco (círculo de marca en el tablero) — y
// ambos necesitan contraste suficiente. Un dorado cremoso fallaba en los dos.
export const VICTIM_COLOR = { bg: '#6c6571', ring: '#9a93a0', name: 'ceniza' }

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

// Variantes por zona de los tintes de habitación (misma longitud y mismo uso:
// se ciclan por orden de sala). Cada set varía LUMINOSIDAD además de tono: los
// jugadores leen los límites de habitación de un vistazo, así que un set
// monocromo — por muy coherente que fuese con la ambientación — degradaría el
// juego, no solo la estética.

// Montaña: maderas, terracota, musgo y piedra. Gama cálida, pero alternando
// lavados densos y claros para que dos salas contiguas nunca se confundan.
export const ROOM_TINTS_MONTANA = [
  'rgba(166, 106, 58, 0.20)', // roble tostado
  'rgba(109, 122, 82, 0.19)', // musgo
  'rgba(214, 176, 122, 0.16)', // arena clara
  'rgba(140, 74, 48, 0.17)', // terracota profunda
  'rgba(122, 134, 128, 0.16)', // piedra fría
  'rgba(196, 150, 84, 0.22)', // miel
  'rgba(92, 58, 30, 0.14)', // nogal
  'rgba(168, 186, 142, 0.18)', // verde pálido
  'rgba(150, 96, 84, 0.16)', // ladrillo apagado
  'rgba(224, 198, 156, 0.20)', // haya
]

// Apartamento: hormigón, acero, cristal y un par de acentos fríos. Más apagado
// que montaña a propósito — es lo que separa las dos zonas de un vistazo.
export const ROOM_TINTS_APARTAMENTO = [
  'rgba(96, 110, 130, 0.24)', // hormigón
  'rgba(198, 208, 218, 0.30)', // niebla clara
  'rgba(56, 66, 82, 0.20)', // grafito
  'rgba(112, 148, 150, 0.24)', // verdigrís
  'rgba(150, 168, 186, 0.16)', // acero claro
  'rgba(72, 98, 140, 0.22)', // azul urbano
  'rgba(150, 138, 164, 0.22)', // lila ceniza
  'rgba(212, 220, 226, 0.34)', // cristal
  'rgba(78, 98, 96, 0.22)', // pizarra verdosa
  'rgba(164, 152, 136, 0.22)', // arena fría
]

export function colorForCharacter(name, characters) {
  if (name === characters.victim) return VICTIM_COLOR
  const idx = characters.suspects.indexOf(name)
  return SUSPECT_COLORS[idx % SUSPECT_COLORS.length]
}
