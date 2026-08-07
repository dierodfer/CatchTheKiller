// Temas visuales de las zonas — la cara presentable de `game/zones.js`.
//
// Allí vive lo que la lógica necesita (qué zonas hay, cuál le toca a cada
// semilla y cómo se llaman los elementos); aquí, cómo se ven. Ambos módulos se
// indexan por el mismo id, así que la zona es una sola cosa partida en dos
// capas, no dos conceptos paralelos.
//
// Una zona no cambia el mapa, las pistas ni la regla del asesino: cambia el
// mobiliario, los materiales y la atmósfera.
//
// El SUELO no se declara aquí entero: el material lo elige la habitación
// (`floorMaterials.js`) y la zona solo aporta sus tintas. Una cocina lleva
// baldosa en las tres zonas; lo que cambia es si esa baldosa es de barro, de
// gres o de 8 bits.
//
// AVISO sobre los materiales CSS: `ambient` se asigna a `background-image`, que
// admite SOLO imágenes. La posición y el tamaño van en sus propias longhands.
// Meterlas dentro del string —sintaxis del atajo `background`— invalida la
// declaración entera y el navegador la descarta en silencio: es exactamente el
// fallo que mantuvo esta capa invisible desde que se escribió.

import { Building2, Gamepad2, Mountain } from 'lucide-react'
import { ZONE_IDS, zoneForSeed } from '@/game/zones.js'
import { FURNITURE_SPRITES } from './pixelSprites.js'
import { ROOM_TINTS, ROOM_TINTS_MONTANA, ROOM_TINTS_APARTAMENTO } from './palette.js'

export const ZONES = {
  // ─── Casa de montaña ────────────────────────────────────────────────────
  // Cálido-terroso: roble, hierro y lana. La chimenea y la cómoda sustituyen a
  // la planta y al televisor (ver ZONE_ELEMENTS en game/zones.js).
  montana: {
    id: 'montana',
    label: 'Casa de montaña',
    short: 'Montaña',
    icon: Mountain,
    accent: '#d8a673',
    accentSoft: 'rgba(216, 166, 115, 0.16)',
    glow: 'rgba(160, 125, 60, 0.55)',

    art: 'flat',
    ink: '#6b4423',
    // id de elemento -> icono de Material Symbols.
    furniture: {
      mesa: 'table_restaurant',
      TV: 'dresser',
      planta: 'fireplace',
      estantería: 'shelves',
      silla: 'chair_alt',
      cama: 'single_bed',
    },

    ambient: {
      backgroundImage:
        'repeating-conic-gradient(from 0deg, rgba(216,166,115,0.26) 0% 25%, transparent 0% 50%),' +
        ' repeating-conic-gradient(from 90deg, rgba(120,72,40,0.14) 0% 25%, transparent 0% 50%)',
      backgroundSize: '10px 10px, 10px 10px',
      backgroundPosition: '0 0, 5px 5px',
    },
    ambientOpacity: 0.26,
    frame: { background: 'rgba(244, 235, 220, 0.80)' },
    tints: ROOM_TINTS_MONTANA,

    // `filter` es lo único que la zona toca del sprite de suelo: un sepia
    // marcado empuja cualquier tile hacia el ámbar cálido de la casa de
    // montaña, y es el lavado de la habitación (`tints`, debajo, en `multiply`)
    // el que sigue aportando el matiz concreto de cada sala.
    floor: {
      filter: 'sepia(0.5) saturate(1.35) brightness(0.94) contrast(1.05)',
      fallback: 'parquet',
      blend: 'multiply',
      opacity: 0.85,
    },

    rug: {
      layers: [
        {
          id: 'bandas',
          image:
            'repeating-linear-gradient(90deg, rgba(150,74,48,0.55) 0 6px,' +
            ' rgba(196,142,88,0.50) 6px 12px, rgba(88,96,74,0.50) 12px 16px)',
          opacity: 0.9,
        },
        {
          id: 'trama',
          image:
            'repeating-linear-gradient(45deg, rgba(255,246,232,0.40) 0 2px, transparent 2px 6px)',
          blend: 'soft-light',
          opacity: 0.35,
        },
      ],
    },

    wall: { color: '#5c3a1e', outerPx: 5, roomPx: 3, thinColor: 'rgba(60,38,20,0.20)', thinPx: 1 },
    // El cristal tira a cielo, no a crema: una ventana tiene que leerse como un
    // hueco de luz contra el tablero claro, y un tono cálido se disolvería.
    window: { frame: '#8a5a2b', frameScale: 1, glass: '#c4dbdd', glassRadius: 999 },
  },

  // ─── Apartamento en la ciudad ───────────────────────────────────────────
  // Piso alto de rascacielos: hormigón, acero y cristal. Los ventanales son el
  // motivo dominante — de ahí el marco fino y el cristal de cantos rectos.
  apartamento: {
    id: 'apartamento',
    label: 'Apartamento en la ciudad',
    short: 'Ciudad',
    icon: Building2,
    accent: '#b9c2d6',
    accentSoft: 'rgba(185, 194, 214, 0.16)',
    glow: 'rgba(122, 145, 178, 0.55)',

    art: 'flat',
    ink: '#39414e',
    furniture: {
      mesa: 'table_bar',
      TV: 'tv',
      planta: 'potted_plant',
      estantería: 'shelves',
      silla: 'chair',
      cama: 'king_bed',
    },

    ambient: {
      backgroundImage:
        'repeating-linear-gradient(0deg, rgba(70,80,96,0.10) 0 1px, transparent 1px 14px),' +
        ' repeating-linear-gradient(90deg, rgba(70,80,96,0.10) 0 1px, transparent 1px 14px)',
      backgroundSize: 'auto, auto',
      backgroundPosition: '0 0, 0 0',
    },
    ambientOpacity: 0.34,
    frame: { background: 'rgba(238, 240, 243, 0.82)' },
    tints: ROOM_TINTS_APARTAMENTO,

    // Desatura casi del todo: el hormigón/acero del apartamento no tiene tono
    // propio, así que el color lo pone íntegro el lavado de la habitación.
    floor: {
      filter: 'grayscale(0.75) brightness(1.12) contrast(1.05)',
      fallback: 'baldosa',
      blend: 'multiply',
      opacity: 0.8,
    },

    rug: {
      layers: [
        {
          id: 'bandas',
          image:
            'repeating-linear-gradient(90deg, rgba(96,104,118,0.42) 0 10px,' +
            ' rgba(140,150,166,0.38) 10px 20px)',
          opacity: 0.85,
        },
        {
          id: 'retícula',
          image:
            'repeating-linear-gradient(0deg, rgba(28,32,38,0.22) 0 1px, transparent 1px 10px)',
          opacity: 0.5,
        },
      ],
    },

    // `thinPx: 0` a propósito: la junta del suelo YA dibuja la rejilla interior.
    // Mantener además el borde fino duplicaría cada línea.
    wall: { color: '#2b3038', outerPx: 4, roomPx: 2, thinColor: 'transparent', thinPx: 0 },
    // Marco de acero CLARO, no negro: un ventanal está casi siempre en un muro
    // exterior, y un marco oscuro sobre un muro oscuro no se vería.
    window: { frame: '#8794a6', frameScale: 0.6, glass: '#a8c8e0', glassRadius: 0 },
  },

  // ─── Mansión 8-bit ──────────────────────────────────────────────────────
  // El pixel art original del proyecto, ascendido a zona propia: conserva sus
  // sprites, su dorado y su alfombra. Gana los suelos por habitación, que aquí
  // se pintan con las tintas cálidas de siempre.
  pixel: {
    id: 'pixel',
    label: 'Mansión 8-bit',
    short: '8-bit',
    icon: Gamepad2,
    accent: '#cba35c',
    accentSoft: 'rgba(203, 163, 92, 0.18)',
    glow: 'rgba(160, 125, 60, 0.55)',

    art: 'pixel',
    furniture: FURNITURE_SPRITES,

    ambient: {
      backgroundImage:
        'repeating-conic-gradient(from 0deg, rgba(203,163,92,0.24) 0% 25%, transparent 0% 50%),' +
        ' repeating-conic-gradient(from 90deg, rgba(116,82,122,0.14) 0% 25%, transparent 0% 50%)',
      backgroundSize: '10px 10px, 10px 10px',
      backgroundPosition: '0 0, 5px 5px',
    },
    ambientOpacity: 0.22,
    frame: { background: 'rgba(244, 235, 220, 0.75)' },
    tints: ROOM_TINTS,

    // Sin filtro: la identidad de esta zona es precisamente el pixel art a todo
    // color, coherente con el resto de su arte. `multiply`, no `soft-light`:
    // con luz suave las diez salas salían casi idénticas y el suelo dejaba de
    // distinguir una habitación de otra, que es justo su cometido.
    floor: {
      filter: 'none',
      fallback: 'damero',
      blend: 'multiply',
      opacity: 0.9,
    },

    rug: {
      layers: [
        {
          id: 'trama',
          image:
            'repeating-linear-gradient(0deg, rgba(160,125,60,0.45) 0 4px, rgba(116,82,122,0.4) 4px 8px),' +
            ' repeating-linear-gradient(90deg, rgba(203,163,92,0.32) 0 4px, transparent 4px 8px)',
          opacity: 0.85,
        },
        {
          id: 'dither',
          image: 'repeating-conic-gradient(rgba(255,255,255,0.55) 0% 25%, transparent 0% 50%)',
          size: '6px 6px',
          blend: 'soft-light',
          opacity: 0.25,
        },
      ],
    },

    wall: { color: '#a07d3c', outerPx: 5, roomPx: 3, thinColor: 'rgba(39,24,41,0.16)', thinPx: 1 },
    window: { frame: '#6f9bc9', frameScale: 1, glass: '#eaf3fb', glassRadius: 999 },
  },
}

// En el orden de ZONE_IDS, que es el que usa `zoneForSeed`.
export const ZONE_LIST = ZONE_IDS.map((id) => ZONES[id])

// Tema visual de la zona que le toca a una semilla.
export const themeForSeed = (seed) => ZONES[zoneForSeed(seed)]
