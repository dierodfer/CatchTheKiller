// Zonas temáticas — capa puramente VISUAL sobre el juego (no toca la lógica).
//
// Cada caso generado se ambienta en una de dos zonas. La zona se deriva de la
// semilla del puzzle (`puzzle.seed`), así es reproducible y no añade estado:
// no cambia el mapa, las pistas ni la regla del asesino; solo la atmósfera
// (paleta de acento, textura de fondo y un distintivo temático).
//
// Las dos zonas son distinguibles a golpe de vista pero cohesivas dentro del
// sistema "Botanica at Dusk": ambas viven sobre el mismo fondo ciruela y
// comparten el dorado como hilo conductor; cambian la temperatura y la textura.

import { Building2, Mountain } from 'lucide-react'

export const ZONES = {
  // Apartamento en la ciudad — frío-neutro: concreto suave, lino, mármol.
  apartamento: {
    id: 'apartamento',
    label: 'Apartamento en la ciudad',
    short: 'Ciudad',
    icon: Building2,
    accent: '#b9c2d6', // fría, dentro del sistema
    accentSoft: 'rgba(185, 194, 214, 0.16)',
    // Textura: vetas finas tipo lino/mármol sobre un velo frío.
    texture:
      'repeating-linear-gradient(115deg, rgba(185,194,214,0.05) 0 2px, transparent 2px 9px),' +
      'repeating-linear-gradient(25deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 14px)',
    glow: 'rgba(206, 214, 232, 0.6)',
  },

  // Casa de montaña — cálido-terroso: madera, piedra, lana.
  montana: {
    id: 'montana',
    label: 'Casa de montaña',
    short: 'Montaña',
    icon: Mountain,
    accent: '#d8a673', // cálida, dentro del sistema
    accentSoft: 'rgba(216, 166, 115, 0.16)',
    // Textura: veta de madera cálida en diagonal suave.
    texture:
      'repeating-linear-gradient(50deg, rgba(216,166,115,0.06) 0 3px, transparent 3px 11px),' +
      'repeating-linear-gradient(50deg, rgba(120,72,40,0.05) 0 1px, transparent 1px 22px)',
    glow: 'rgba(230, 184, 130, 0.62)',
  },
}

export const ZONE_LIST = Object.values(ZONES)

// Zona estable para una semilla dada (reproducible, sin estado adicional).
export function zoneForSeed(seed = 0) {
  const n = Math.abs(Math.trunc(seed))
  return n % 2 === 0 ? ZONES.apartamento : ZONES.montana
}
