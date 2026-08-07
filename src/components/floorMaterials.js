// Materiales de suelo, uno por TIPO de habitación.
//
// La sala manda el material (una cocina lleva baldosa, una bodega ladrillo) y
// la zona manda el color. Así el tablero se lee como una casa de verdad y no
// como una cuadrícula teñida: el jugador reconoce la Biblioteca por su espiga
// igual que por su rótulo, y la misma Biblioteca cambia de madera a hormigón
// según la ambientación.
//
// Cada material es una función `(ink, size) -> { backgroundImage, backgroundSize }`
// donde `ink` son las tres tintas de la zona (clara, media y línea de junta) y
// `size` es el lado de la celda en px. Se escalan con la celda a propósito: un
// patrón de periodo fijo se convierte en ruido cuando el tablero se comprime a
// 36 px en móvil.
//
// AVISO: lo que se devuelve va a `background-image`, que SOLO admite imágenes.
// La posición y el tamaño van en sus propias longhands. Meterlas dentro del
// string —sintaxis del atajo `background`— invalida la declaración entera.

import { ROOM_NAMES } from '@/game/constants.js'

// Fracción del lado de la celda, con un mínimo legible.
const u = (size, frac, min = 3) => Math.max(min, Math.round(size * frac))

// Mosaico SVG como data URI, para los patrones que no se pueden expresar con
// degradados. Se codifica entero porque las tintas son `rgba(...)`, con comas y
// paréntesis que romperían la URL sin escapar.
const svgTile = (w, h, body) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`,
  )}")`

export const MATERIALS = {
  // Parquet en espiga: dos tramas diagonales cruzadas.
  espiga: (ink, size) => {
    const p = u(size, 0.26, 8)
    return {
      backgroundImage:
        `repeating-linear-gradient(45deg, ${ink.l} 0 ${p - 1}px, ${ink.d} ${p - 1}px ${p}px),` +
        ` repeating-linear-gradient(-45deg, ${ink.l} 0 ${p - 1}px, ${ink.d} ${p - 1}px ${p}px)`,
      backgroundSize: 'auto, auto',
    }
  },

  // Damero de baldosa: dos tonos alternos.
  damero: (ink, size) => {
    const t = u(size, 0.5, 8)
    return {
      backgroundImage: `repeating-conic-gradient(${ink.l} 0% 25%, ${ink.m} 0% 50%)`,
      backgroundSize: `${t}px ${t}px`,
    }
  },

  // Tarima ancha en horizontal: junta marcada al pie de cada tabla.
  parquet: (ink, size) => {
    const h = u(size, 0.34, 7)
    return {
      backgroundImage:
        `linear-gradient(180deg, ${ink.l} 0 calc(100% - 1px), ${ink.d} calc(100% - 1px) 100%),` +
        ` linear-gradient(90deg, ${ink.d} 0 1px, transparent 1px 100%)`,
      backgroundSize: `${size}px ${h}px, ${size}px ${h}px`,
    }
  },

  // Listones estrechos en vertical: la misma madera, otro despiece.
  listones: (ink, size) => {
    const w = u(size, 0.2, 5)
    return {
      backgroundImage: `repeating-linear-gradient(90deg, ${ink.l} 0 ${w - 1}px, ${ink.d} ${w - 1}px ${w}px)`,
      backgroundSize: 'auto',
    }
  },

  // Baldosa de gran formato: cuatro losas por celda. Con una sola losa la junta
  // caía justo en el borde y quedaba tapada por el muro, dejando la sala lisa.
  baldosa: (ink, size) => {
    const t = u(size, 0.5, 10)
    return {
      backgroundImage:
        `linear-gradient(180deg, ${ink.l} 0 calc(100% - 1.5px), ${ink.d} calc(100% - 1.5px) 100%),` +
        ` linear-gradient(90deg, transparent 0 calc(100% - 1.5px), ${ink.d} calc(100% - 1.5px) 100%)`,
      backgroundSize: `${t}px ${t}px, ${t}px ${t}px`,
    }
  },

  // Mosaico: retícula fina de teselas pequeñas.
  mosaico: (ink, size) => {
    const t = u(size, 0.18, 5)
    return {
      backgroundImage:
        `repeating-linear-gradient(0deg, ${ink.d} 0 1px, ${ink.l} 1px ${t}px),` +
        ` repeating-linear-gradient(90deg, ${ink.d} 0 1px, transparent 1px ${t}px)`,
      backgroundSize: 'auto, auto',
    }
  },

  // Losa de piedra: aparejo irregular, más ancho que alto.
  piedra: (ink, size) => {
    const w = u(size, 0.62, 12)
    const h = u(size, 0.38, 8)
    return {
      backgroundImage:
        `linear-gradient(180deg, ${ink.m} 0 calc(100% - 1.5px), ${ink.d} calc(100% - 1.5px) 100%),` +
        ` linear-gradient(90deg, ${ink.d} 0 1.5px, transparent 1.5px 100%)`,
      backgroundSize: `${w}px ${h}px, ${w}px ${h}px`,
    }
  },

  // Ladrillo visto, aparejo a soga: las llagas de una hilada caen a media pieza
  // de las de la siguiente. Va en SVG y no en degradados porque una junta
  // vertical que solo ocupe media altura del mosaico es un patrón en DOS
  // dimensiones, y un linear-gradient siempre tiñe el alto completo: con
  // degradados salen hiladas alineadas, que es un aparejo distinto.
  ladrillo: (ink, size) => {
    const w = u(size, 0.5, 12)
    const h = u(size, 0.25, 6)
    return {
      backgroundImage: svgTile(
        w,
        h * 2,
        `<rect width="${w}" height="${h * 2}" fill="${ink.m}"/>` +
          `<g stroke="${ink.d}" stroke-width="1.2">` +
          `<path d="M0 ${h}H${w}M0 ${h * 2}H${w}"/>` +
          `<path d="M${w / 2} 0V${h}M0 ${h}V${h * 2}M${w} ${h}V${h * 2}"/>` +
          `</g>`,
      ),
      backgroundSize: `${w}px ${h * 2}px`,
    }
  },

  // Moqueta: trama diagonal densa, sin juntas.
  moqueta: (ink, size) => {
    const p = u(size, 0.09, 4)
    return {
      backgroundImage: `repeating-linear-gradient(45deg, ${ink.l} 0 ${p}px, ${ink.m} ${p}px ${p * 2}px)`,
      backgroundSize: 'auto',
    }
  },

  // Terrazo: fondo liso salpicado de áridos.
  terrazo: (ink, size) => {
    const t = u(size, 0.42, 10)
    return {
      backgroundImage:
        `radial-gradient(${ink.d} 1.8px, transparent 1.9px),` +
        ` radial-gradient(${ink.m} 2.4px, transparent 2.5px),` +
        ` linear-gradient(0deg, ${ink.l}, ${ink.l})`,
      backgroundSize: `${t}px ${t}px, ${Math.round(t * 0.7)}px ${Math.round(t * 0.7)}px, auto`,
      backgroundPosition: `0 0, ${Math.round(t / 3)}px ${Math.round(t / 2)}px, 0 0`,
    }
  },
}

// Material de cada sala. Indexado por NOMBRE, no por posición: es lo que hace
// que la Cocina sea siempre de baldosa y la Bodega siempre de ladrillo, en
// todas las partidas. Las 10 entradas cubren `ROOM_NAMES` al completo.
export const ROOM_MATERIAL = {
  Salón: 'espiga',
  Cocina: 'damero',
  Dormitorio: 'moqueta',
  Estudio: 'parquet',
  Pasillo: 'mosaico',
  Biblioteca: 'listones',
  Comedor: 'baldosa',
  Terraza: 'piedra',
  Bodega: 'ladrillo',
  Galería: 'terrazo',
}

// Índice estable de una sala dentro del catálogo de nombres. Se usa para elegir
// su tinte, de modo que el color de una sala tampoco dependa del orden en que
// el generador la haya creado: la Cocina siempre sale del mismo tono.
export const roomIndexByName = (name) => {
  const i = ROOM_NAMES.indexOf(name)
  return i < 0 ? 0 : i
}
