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
    // Textura: dither de píxeles a cuadros, fría, dos capas desfasadas que
    // forman una trama de 4 tonos (estilo 8-bit).
    texture:
      'repeating-conic-gradient(from 0deg, rgba(185,194,214,0.22) 0% 25%, transparent 0% 50%) 0 0/10px 10px,' +
      ' repeating-conic-gradient(from 90deg, rgba(255,255,255,0.14) 0% 25%, transparent 0% 50%) 5px 5px/10px 10px',
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
    // Textura: dither de píxeles a cuadros, cálida, dos capas desfasadas que
    // forman una trama de 4 tonos (estilo 8-bit).
    texture:
      'repeating-conic-gradient(from 0deg, rgba(216,166,115,0.26) 0% 25%, transparent 0% 50%) 0 0/10px 10px,' +
      ' repeating-conic-gradient(from 90deg, rgba(120,72,40,0.14) 0% 25%, transparent 0% 50%) 5px 5px/10px 10px',
    glow: 'rgba(160, 125, 60, 0.55)',
  },
}

export const ZONE_LIST = Object.values(ZONES)

// Zona estable para una semilla dada (reproducible, sin estado adicional).
export function zoneForSeed(seed = 0) {
  const n = Math.abs(Math.trunc(seed))
  return n % 2 === 0 ? ZONES.apartamento : ZONES.montana
}
