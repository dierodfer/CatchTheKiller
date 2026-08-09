// Primitivas de dibujo compartidas por Cell (tablero de juego) y MapPreview
// (miniatura de la pantalla inicial): bordes de celda, marco de ventana,
// cristal, suelo y las capas de la alfombra. Centralizar esto evita que ambos
// componentes dupliquen constantes y cálculos (y se desincronicen).
//
// Todas las funciones reciben la ZONA como primer parámetro: es el punto único
// por el que la ambientación entra en el tablero, así que un material nuevo se
// define una vez en zones.js y aparece a la vez en el tablero y en la miniatura.

import { cellKey } from '@/game/constants.js'
import { MATERIALS, ROOM_MATERIAL } from './floorMaterials.js'
import { RUG_TEXTURES } from './rugTextures.js'

// Tinte dorado y contornos del tablero (resaltado de revelado, soltar ficha,
// casilla seleccionada). NO se tematizan: son señales de interacción, no
// decorado. Que el destino de soltado o la habitación revelada cambien de
// color según la zona debilitaría el feedback sin aportar ambientación.
export const REVEAL_TINT = 'rgba(203,163,92,0.30)'
export const REVEAL_HIGHLIGHT = '#a07d3c'
export const DROP_OUTLINE = '2px solid rgba(255,255,255,0.7)'
// Casilla con el popup de marcado abierto: mismo dorado de foco que usa el
// resto de la app (ver README, "foco visible en dorado"). Un trazo más
// grueso que DROP_OUTLINE porque aquí es la única señal de qué casilla se
// está editando —el popup flota aparte y puede no tocar la celda—, así que
// tiene que sostenerse por sí solo, no solo reforzar un gesto en curso.
export const SELECTED_OUTLINE = '3px solid #cba35c'

// Lado del borde de la celda que ocupa la ventana, según su pared.
export const WINDOW_BORDER_SIDE = {
  norte: 'borderTop',
  sur: 'borderBottom',
  oeste: 'borderLeft',
  este: 'borderRight',
}

// Marco de ventana. `px` es el grosor base del llamante (tablero 5, miniatura
// 3) y la zona lo escala: el acero del apartamento es deliberadamente más fino
// que la madera de la casa de montaña.
export const windowBorder = (zone, px) =>
  `${Math.max(1, Math.round(px * zone.window.frameScale))}px solid ${zone.window.frame}`

// Estilo del cristal pegado a la pared: geometría, color y radio. `inset`
// separa el cristal de las esquinas (px); su grosor es fijo (~2px). El radio
// viene de la zona porque un ventanal de acero quiere cantos rectos y uno de
// madera, redondeados.
export function windowGlassStyle(zone, wall, inset) {
  const T = 2
  const skin = { background: zone.window.glass, borderRadius: zone.window.glassRadius }
  switch (wall) {
    case 'norte':
      return { ...skin, left: inset, right: inset, top: T, height: T }
    case 'sur':
      return { ...skin, left: inset, right: inset, bottom: T, height: T }
    case 'oeste':
      return { ...skin, top: inset, bottom: inset, left: T, width: T }
    case 'este':
      return { ...skin, top: inset, bottom: inset, right: T, width: T }
    default:
      return {}
  }
}

// Estilo del suelo de una celda: el MATERIAL lo decide la habitación y el COLOR
// la zona (una sala sin material declarado cae en el fallback de la zona).
// Salvo que la zona declare `floor.pattern` — entonces ese dibujo va en TODAS
// sus salas: es como la mansión 8-bit conserva su damero de siempre, en vez
// de un sprite distinto por tipo de habitación.
export function floorPatternStyle(zone, roomName, size) {
  const { pattern } = zone.floor
  let skin
  if (pattern) {
    // Igual que los sprites: el periodo se escala con la celda, no es fijo.
    const t = Math.max(4, Math.round(size / pattern.div))
    skin = { backgroundImage: pattern.image, backgroundSize: `${t}px ${t}px` }
  } else {
    const material = MATERIALS[ROOM_MATERIAL[roomName]] || MATERIALS[zone.floor.fallback]
    skin = material(zone, size)
  }
  return {
    ...skin,
    mixBlendMode: zone.floor.blend,
    opacity: zone.floor.opacity,
  }
}

// Estilos de la alfombra en DOS elementos anidados: `frame` (el ribete, borde
// sólido del color de la zona) y `fill` (el tejido de `RUG_TEXTURES`, dentro).
// Van separados porque el `filter` es del TEJIDO, no de la alfombra entera —
// si tocara también al ribete, el sepia o el grayscale de la zona le
// arrastrarían el color y dejaría de leerse como una cinta cosida al borde.
//
// El ribete no llega a los muros: `inset` lo separa del canto de la celda,
// dejando ver el suelo — sin eso se lee como moqueta empotrada, no como una
// pieza suelta apoyada encima. Grosor y radio son proporcionales a la celda;
// el radio interior resta el grosor del ribete para que ambas curvas queden
// concéntricas (si el ribete es más ancho que el radio, sale 0 y el tejido
// queda en pico dentro de una cinta redondeada). El tile del tejido también
// se escala con la celda, no a tamaño fijo, o se vuelve ruido en móvil.
export function rugLayerStyles(zone, cellSize) {
  const border = Math.max(2, Math.round(cellSize * zone.rug.borderFrac))
  const radius = Math.round(cellSize * zone.rug.radiusFrac)
  const tex = RUG_TEXTURES[zone.rug.texture]
  const t = Math.max(24, Math.round(cellSize / tex.tileDiv))
  return {
    // En píxeles y sobre la celda, no en porcentaje sobre el rectángulo: la
    // alfombra puede ser una tira de 1×6, y un porcentaje dejaría allí una
    // franja de suelo seis veces más ancha por los extremos que por los
    // lados. Con una medida fija el marco de suelo es igual a lo largo del
    // contorno entero, salga la alfombra con la forma que salga.
    inset: Math.max(2, Math.round(cellSize * zone.rug.insetFrac)),
    frame: {
      borderStyle: 'solid',
      borderWidth: border,
      borderColor: zone.rug.border,
      borderRadius: radius,
    },
    fill: {
      borderRadius: Math.max(0, radius - border),
      backgroundImage: `url("${tex.tile}")`,
      backgroundSize: `${t}px ${t}px`,
      // Mantiene el hilo del tejido definido (el tile va casi a escala 1:1).
      imageRendering: 'pixelated',
      // Sombra hacia dentro: oscurece el tejido justo donde se encuentra con
      // el ribete, que es lo que da el pliegue del pelo contra la cinta. Sin
      // ella, las dos capas se tocan en un canto plano de recorte.
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.22)',
      filter: zone.rug.filter,
      opacity: zone.rug.opacity,
    },
  }
}

// Fábrica de bordes de celda: muro exterior, muro entre habitaciones y
// —opcional— línea interior de rejilla, con los colores y grosores de la
// zona. `scale` adelgaza los trazos en la miniatura (el tablero usa 1). Las
// tres zonas usan `thinPx: 0`: el propio suelo ya separa una celda de la
// siguiente, y una línea CSS encima solo partía el sprite en dos.
export function makeBordersFor(map, roomLookup, size, zone, scale = 1) {
  const px = (n) => Math.max(1, Math.round(n * scale))
  const OUTER = `${px(zone.wall.outerPx)}px solid ${zone.wall.color}`
  const ROOM = `${px(zone.wall.roomPx)}px solid ${zone.wall.color}`
  const THIN = zone.wall.thinPx <= 0 ? 'none' : `${px(zone.wall.thinPx)}px solid ${zone.wall.thinColor}`

  return (r, c) => {
    const room = roomLookup[cellKey(r, c)]
    const sideBorder = (nr, nc) => {
      // Fuera del tablero o celda void (mapa irregular): muro exterior.
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) return OUTER
      if (map.voidCells?.has(cellKey(nr, nc))) return OUTER
      if (roomLookup[cellKey(nr, nc)] !== room) return ROOM
      return THIN
    }
    return {
      top: sideBorder(r - 1, c),
      bottom: sideBorder(r + 1, c),
      left: sideBorder(r, c - 1),
      right: sideBorder(r, c + 1),
    }
  }
}
