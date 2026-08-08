// Materiales de suelo, uno por TIPO de habitación.
//
// La sala manda el material (una cocina lleva baldosa, una bodega ladrillo) y
// la zona manda el TINTE (no el dibujo): cada material es un sprite de 16×16 px
// recortado de un set profesional (`floorSprites.js`, Kenney CC0 — ver ese
// fichero), y la zona lo tiñe con un `filter` CSS y lo combina con su lavado de
// habitación (`zone.tints`) mediante `mixBlendMode`. Así el tablero se lee como
// una casa de verdad —el jugador reconoce la Biblioteca por su suelo igual que
// por su rótulo— y la misma Biblioteca cambia de tono según la ambientación sin
// que haga falta un sprite distinto por zona.
//
// `zone.floor.filter` es deliberadamente el único punto donde una zona toca el
// suelo: desaturar + oscurecer dirige el protagonismo del color hacia el lavado
// de la habitación (igual que hacían antes las tres tintas `{l,m,d}`), mientras
// que la zona 8-bit no aplica filtro y deja el pixel art a todo color, coherente
// con el resto de su arte.
//
// AVISO: lo que se devuelve va a `background-image`, que SOLO admite imágenes.
// La posición y el tamaño van en sus propias longhands. Meterlas dentro del
// string —sintaxis del atajo `background`— invalida la declaración entera.

import { ROOM_NAMES } from '@/game/constants.js'
import { FLOOR_TILES } from './floorSprites.js'

// Fracción del lado de la celda, con un mínimo legible: cuántas veces se repite
// el tile de 16px dentro de una celda. `repeat` baja no implica menos detalle —
// implica un tile más GRANDE (una losa por celda); `repeat` alta da grano fino
// (varias tesela/listón por celda). Se escala con la celda a propósito: un
// periodo fijo se convierte en ruido cuando el tablero se comprime a 36px móvil.
const spriteMaterial =
  (tile, repeat, minPx = 10) =>
  (zone, size) => {
    const t = Math.max(minPx, Math.round(size / repeat))
    return {
      backgroundImage: `url("${tile}")`,
      backgroundSize: `${t}px ${t}px`,
      imageRendering: 'pixelated',
      filter: zone.floor.filter,
    }
  }

export const MATERIALS = {
  espiga: spriteMaterial(FLOOR_TILES.salon, 2.2),
  damero: spriteMaterial(FLOOR_TILES.cocina, 2.4),
  moqueta: spriteMaterial(FLOOR_TILES.dormitorio, 2.6),
  parquet: spriteMaterial(FLOOR_TILES.estudio, 2.4),
  mosaico: spriteMaterial(FLOOR_TILES.pasillo, 3.4),
  listones: spriteMaterial(FLOOR_TILES.biblioteca, 3.4),
  baldosa: spriteMaterial(FLOOR_TILES.comedor, 1.4, 12),
  piedra: spriteMaterial(FLOOR_TILES.terraza, 1.4, 12),
  ladrillo: spriteMaterial(FLOOR_TILES.bodega, 2.4),
  terrazo: spriteMaterial(FLOOR_TILES.galeria, 2.0),
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
// Una sala desconocida cae en el índice 0 en vez de en el -1 de `indexOf`, que
// como índice de tinte daría `undefined`.
export const roomIndexByName = (name) => Math.max(0, ROOM_NAMES.indexOf(name))
