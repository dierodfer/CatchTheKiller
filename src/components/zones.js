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
// AVISO sobre los materiales CSS: `ambient` y `floor.image` se asignan a
// `background-image`, que admite SOLO imágenes. La posición y el tamaño van en
// sus propias longhands (`backgroundPosition`, `backgroundSize`). Meterlas
// dentro del string —sintaxis del atajo `background`— invalida la declaración
// entera y el navegador la descarta en silencio: es exactamente el fallo que
// mantuvo esta capa invisible desde que se escribió.

import { Building2, Gamepad2, Mountain } from 'lucide-react'
import { ZONE_IDS, zoneForSeed } from '@/game/zones.js'
import { PIXEL_FLOOR_PATTERN } from './pixelSprites.js'
import { FURNITURE_SPRITES } from './pixelSprites.js'
import { FURNITURE_MONTANA } from './flatSpritesMontana.js'
import { FURNITURE_APARTAMENTO } from './flatSpritesApartamento.js'
import { ROOM_TINTS, ROOM_TINTS_MONTANA, ROOM_TINTS_APARTAMENTO } from './palette.js'

export const ZONES = {
  // ─── Casa de montaña ────────────────────────────────────────────────────
  // Cálido-terroso: roble, hierro forjado y lana. Suelo de tarima.
  montana: {
    id: 'montana',
    label: 'Casa de montaña',
    short: 'Montaña',
    icon: Mountain,
    accent: '#d8a673',
    accentSoft: 'rgba(216, 166, 115, 0.16)',
    glow: 'rgba(160, 125, 60, 0.55)',

    art: 'flat',
    furniture: FURNITURE_MONTANA,

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

    // Tarima horizontal: el tile es tan ancho como la celda y un tercio de
    // alto, así que las juntas caen a la misma altura en toda la fila y las
    // tablas se leen continuas de celda a celda. (Cada celda es su propio div y
    // reinicia el patrón, de ahí que las tablas vayan en horizontal y no en
    // vertical.)
    floor: {
      image:
        // Junta entre tablas: la línea fuerte, la que hace legible la tarima.
        'linear-gradient(180deg, transparent 0 calc(100% - 1.5px), rgba(92,56,26,0.55) calc(100% - 1.5px) 100%),' +
        // Testa: junta corta al inicio de la tabla.
        ' linear-gradient(90deg, rgba(92,56,26,0.28) 0 1px, transparent 1px 100%),' +
        // Veta: rayas muy tenues dentro de la tabla. Deliberadamente flojas —
        // subirlas convierte la tarima en un rayado vertical.
        ' repeating-linear-gradient(90deg, rgba(92,56,26,0.05) 0 2px, transparent 2px 14px)',
      tileXDiv: 1,
      tileYDiv: 3,
      minTile: 6,
      blend: 'multiply',
      opacity: 0.55,
    },

    // Kilim de lana: bandas anchas terracota/arena/musgo y una trama diagonal
    // fina por encima.
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
    furniture: FURNITURE_APARTAMENTO,

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

    // Baldosa de gran formato: una losa por celda, con la junta en dos lados.
    // Sin degradados ni brillos — un "hormigón pulido" degradado rompería el
    // criterio plano igual que un degradado dentro de un mueble.
    floor: {
      image:
        'linear-gradient(180deg, transparent 0 calc(100% - 1px), rgba(38,42,48,0.26) calc(100% - 1px) 100%),' +
        ' linear-gradient(90deg, transparent 0 calc(100% - 1px), rgba(38,42,48,0.26) calc(100% - 1px) 100%)',
      tileXDiv: 1,
      tileYDiv: 1,
      minTile: 8,
      blend: 'multiply',
      opacity: 0.5,
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

    // `thinPx: 0` a propósito: la junta de la baldosa YA dibuja la rejilla
    // interior. Mantener además el borde fino duplicaría cada línea interior.
    wall: { color: '#2b3038', outerPx: 4, roomPx: 2, thinColor: 'transparent', thinPx: 0 },
    // Marco de acero CLARO, no negro: un ventanal está casi siempre en un muro
    // exterior, y un marco oscuro sobre un muro oscuro no se vería. Aquí la
    // ventana se lee como un corte luminoso en la pared, que es justo el motivo
    // de un piso alto acristalado.
    window: { frame: '#8794a6', frameScale: 0.6, glass: '#a8c8e0', glassRadius: 0 },
  },

  // ─── Mansión 8-bit ──────────────────────────────────────────────────────
  // El pixel art original, ascendido a zona propia. Conserva sus sprites, su
  // damero y su dorado. Única diferencia con lo que se veía antes: la capa
  // ambiental por fin se pinta (ver el AVISO de la cabecera), calibrada aquí a
  // una opacidad más baja de la que tenía cuando era invisible.
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

    // `tileXDiv/tileYDiv: 4` con `minTile: 4` reproduce exactamente el
    // `Math.max(4, Math.round(size / 4))` que tenía el damero.
    floor: {
      image: PIXEL_FLOOR_PATTERN,
      tileXDiv: 4,
      tileYDiv: 4,
      minTile: 4,
      blend: 'soft-light',
      opacity: 0.55,
    },

    // Las dos capas históricas de la alfombra (antes en rugPattern.js).
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
