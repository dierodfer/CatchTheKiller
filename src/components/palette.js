// Paletas de color para personajes y habitaciones.

// Colores distintos por sospechoso (índice estable dentro de la partida).
export const SUSPECT_COLORS = [
  { bg: '#2563eb', ring: '#60a5fa', name: 'azul' },
  { bg: '#16a34a', ring: '#4ade80', name: 'verde' },
  { bg: '#d97706', ring: '#fbbf24', name: 'ámbar' },
  { bg: '#7c3aed', ring: '#a78bfa', name: 'violeta' },
  { bg: '#db2777', ring: '#f472b6', name: 'rosa' },
  { bg: '#0891b2', ring: '#22d3ee', name: 'cian' },
]

export const VICTIM_COLOR = { bg: '#475569', ring: '#94a3b8', name: 'gris' }

// Tintes suaves para habitaciones (se ciclan).
export const ROOM_TINTS = [
  'rgba(59,130,246,0.10)',
  'rgba(16,185,129,0.10)',
  'rgba(217,119,6,0.10)',
  'rgba(124,58,237,0.10)',
  'rgba(219,39,119,0.10)',
  'rgba(8,145,178,0.10)',
  'rgba(132,204,22,0.10)',
  'rgba(244,63,94,0.10)',
  'rgba(234,179,8,0.10)',
  'rgba(99,102,241,0.10)',
]

export function colorForCharacter(name, characters) {
  if (name === characters.victim) return VICTIM_COLOR
  const idx = characters.suspects.indexOf(name)
  return SUSPECT_COLORS[idx % SUSPECT_COLORS.length]
}
