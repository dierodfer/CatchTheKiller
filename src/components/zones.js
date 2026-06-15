// Zonas temáticas — capa puramente VISUAL sobre el juego (no toca la lógica).
//
// Cada caso generado se ambienta en una de dos zonas. La zona se deriva de la
// semilla del puzzle (`puzzle.seed`), así es reproducible y no añade estado:
// no cambia el mapa, las pistas ni la regla del asesino; solo la atmósfera
// (paleta de acento, textura de fondo y un distintivo temático).
//
// Las dos zonas son distinguibles a golpe de vista pero cohesivas dentro del
// sistema "Botanica at Dawn": ambas viven sobre el mismo fondo crema y
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
    // Textura: veteado de mármol/lino mediante ruido SVG (feTurbulence de
    // baja frecuencia) más un velo diagonal frío muy sutil.
    texture:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.06 0.09' numOctaves='3' seed='7' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)'/%3E%3C/svg%3E\")," +
      'linear-gradient(115deg, rgba(185,194,214,0.07) 0%, transparent 40%, rgba(255,255,255,0.05) 60%, transparent 100%)',
    glow: 'rgba(122, 145, 178, 0.55)',
  },

  // Casa de montaña — cálido-terroso: madera, piedra, lana.
  montana: {
    id: 'montana',
    label: 'Casa de montaña',
    short: 'Montaña',
    icon: Mountain,
    accent: '#d8a673', // cálida, dentro del sistema
    accentSoft: 'rgba(216, 166, 115, 0.16)',
    // Textura: veta de madera mediante ruido SVG direccional (feTurbulence
    // estirado + feColorMatrix que tiñe el ruido en marrón cálido) más una
    // veta fina adicional.
    texture:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='w'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.012 0.18' numOctaves='2' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.55  0 0 0 0 0.38  0 0 0 0 0.22  0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23w)'/%3E%3C/svg%3E\")," +
      'repeating-linear-gradient(0deg, rgba(120,72,40,0.05) 0 2px, transparent 2px 14px)',
    glow: 'rgba(160, 125, 60, 0.55)',
  },
}

export const ZONE_LIST = Object.values(ZONES)

// Zona estable para una semilla dada (reproducible, sin estado adicional).
export function zoneForSeed(seed = 0) {
  const n = Math.abs(Math.trunc(seed))
  return n % 2 === 0 ? ZONES.apartamento : ZONES.montana
}
