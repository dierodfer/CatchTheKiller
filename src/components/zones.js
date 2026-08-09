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
import { ZONE_IDS, zoneForSeed, resolveRooms } from '@/game/zones.js'
import { FURNITURE_SPRITES, PIXEL_FLOOR_PATTERN } from './pixelSprites.js'
import { KENNEY_FURNITURE_SPRITES } from './furnitureSprites.js'
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

    art: 'sprite',
    furniture: KENNEY_FURNITURE_SPRITES.montana,

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

    // Lana bereber: el mismo sepia del suelo empuja el crudo del tile hacia el
    // ámbar de la casa, así que la alfombra se lee como lana teñida en la misma
    // gama que la tarima en vez de como una pieza traída de otra habitación.
    //
    // Ribete de cuero curtido, apenas insinuado, y esquina muy redondeada:
    // una alfombra de lana ante una chimenea es la pieza más blanda de la
    // casa, y el pico recto es justo lo que le quitaría esa blandura.
    rug: {
      texture: 'berber',
      filter: 'sepia(0.5) saturate(1.35) brightness(0.94) contrast(1.05)',
      opacity: 0.95,
      border: '#ab9573',
      borderFrac: 0.04,
      radiusFrac: 0.32,
      insetFrac: 0.1,
    },

    // `thinPx: 0`: sin rejilla interior. El sprite de tarima ya tiene su propia
    // veta, y una línea CSS encima de dos celdas contiguas del mismo suelo
    // partía la tabla en dos en vez de leerse como una sola pieza continua.
    wall: { color: '#5c3a1e', outerPx: 5, roomPx: 3, thinColor: 'transparent', thinPx: 0 },
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

    art: 'sprite',
    furniture: KENNEY_FURNITURE_SPRITES.apartamento,

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

    // Desatura casi por completo: el hormigón/acero del apartamento no tiene tono
    // propio, así que el color lo pone íntegro el lavado de la habitación.
    floor: {
      filter: 'grayscale(0.75) brightness(1.12) contrast(1.05)',
      fallback: 'baldosa',
      blend: 'multiply',
      opacity: 0.8,
    },

    // Sisal: fibra natural, la nota cálida del piso. Se desatura MENOS que el
    // suelo (0.55 frente a 0.75) a propósito — si se le quita el tono entero, el
    // yute queda gris y la alfombra deja de contrastar con el hormigón. Y no se
    // aclara: un `brightness` por encima de 1 quema la hebra, que es justo lo
    // que la hace parecer tejida.
    //
    // Ribete greige, casi confundido con el propio tejido, y esquina apenas
    // matada: una alfombra de fibra natural se remata con una cinta al tono,
    // no con un color que cante. La curva es pequeña a propósito — este piso
    // va de cantos rectos (ver el cristal, de radio 0), y una esquina muy
    // redondeada rompería esa disciplina. Es también el ribete más fino de
    // las tres zonas, por lo mismo.
    rug: {
      texture: 'sisal',
      filter: 'grayscale(0.55) brightness(0.97) contrast(1.08)',
      opacity: 0.92,
      border: '#948e83',
      borderFrac: 0.032,
      radiusFrac: 0.12,
      insetFrac: 0.1,
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

    // El damero de siempre, el mismo en las diez salas: `pattern` puentea los
    // sprites por tipo de habitación que usan las otras dos zonas (ver
    // `floorPatternStyle`). Aquí el suelo no tiene que distinguir una sala de
    // otra —de eso ya se encarga el tinte, y estas tintas son las originales
    // del proyecto—, sino sostener la textura pixelada del conjunto; un sprite
    // distinto por sala rompía justo esa unidad. `soft-light` a 0.55 es lo que
    // deja el damero como un velo sobre el tinte en vez de como un dibujo con
    // voz propia.
    floor: {
      pattern: { image: PIXEL_FLOOR_PATTERN, div: 4 },
      blend: 'soft-light',
      opacity: 0.55,
    },

    // Sin filtro, como el suelo: el pixel art va a pleno color, y el kilim es
    // la textura que más lo aprovecha — sus bandas y galones son ya de por sí
    // un dibujo a base de tramas, el mismo lenguaje que el resto de la zona.
    //
    // `radiusFrac: 0`, la única zona con la esquina en pico: en una rejilla de
    // píxeles no hay curvas, y redondear aquí delataría que el marco no está
    // dibujado a la misma resolución que el resto del arte. El ribete es el
    // nogal de los muros, no un color nuevo, y se queda el más ancho de las
    // tres pese a aligerarse: a esta resolución uno más fino no se lee.
    rug: {
      texture: 'kilim',
      filter: 'none',
      opacity: 1,
      border: '#9a7c52',
      borderFrac: 0.05,
      radiusFrac: 0,
      insetFrac: 0.1,
    },

    // `thinPx: 0`: el propio damero ya alterna de casilla en casilla, así que
    // una línea CSS encima solo repetía esa función y partía el patrón en dos.
    wall: { color: '#a07d3c', outerPx: 5, roomPx: 3, thinColor: 'transparent', thinPx: 0 },
    window: { frame: '#6f9bc9', frameScale: 1, glass: '#eaf3fb', glassRadius: 999 },
  },
}

// Nombres de habitación de cada zona (ver ZONE_ROOMS en game/zones.js): lo que
// se rotula en el tablero y lo que dicen las pistas. Se añaden aquí, y no en
// el literal de arriba, para no repetir `resolveRooms('montana')` a mano en
// cada zona — un bucle no puede olvidarse de ninguna.
for (const id of ZONE_IDS) ZONES[id].rooms = resolveRooms(id)

// En el orden de ZONE_IDS, que es el que usa `zoneForSeed`.
export const ZONE_LIST = ZONE_IDS.map((id) => ZONES[id])

// Tema visual de la zona que le toca a una semilla.
export const themeForSeed = (seed) => ZONES[zoneForSeed(seed)]
