// Primitivas de dibujo compartidas por Cell (tablero de juego) y MapPreview
// (miniatura de la pantalla inicial): bordes de celda, marco de ventana,
// cristal, suelo y las capas de la alfombra. Centralizar esto evita que ambos
// componentes dupliquen constantes y cálculos (y se desincronicen).
//
// Todas las funciones reciben la ZONA como primer parámetro: es el punto único
// por el que la ambientación entra en el tablero, así que un material nuevo se
// define una vez en zones.js y aparece a la vez en el tablero y en la miniatura.

import { MATERIALS, ROOM_MATERIAL } from './floorMaterials.js'
import { RUG_TEXTURES } from './rugTextures.js'

// Tinte dorado y contornos del tablero (resaltado de revelado, soltar ficha).
// NO se tematizan: son señales de interacción, no decorado. Que el destino de
// soltado o la habitación revelada cambien de color según la zona debilitaría
// el feedback sin aportar ambientación.
export const REVEAL_TINT = 'rgba(203,163,92,0.30)'
export const REVEAL_HIGHLIGHT = '#a07d3c'
export const DROP_OUTLINE = '2px solid rgba(255,255,255,0.7)'

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
// la zona. Una sala sin material declarado (no debería pasar: ROOM_MATERIAL
// cubre los 10 nombres) cae en el material por defecto de la zona.
export function floorPatternStyle(zone, roomName, size) {
  const material = MATERIALS[ROOM_MATERIAL[roomName]] || MATERIALS[zone.floor.fallback]
  return {
    ...material(zone, size),
    mixBlendMode: zone.floor.blend,
    opacity: zone.floor.opacity,
  }
}

// Estilos de la alfombra: UNA capa que cubre el rectángulo entero (no una
// por celda — ver `rugBounds` en useBoardGeometry.js y su render en
// Board.jsx), en DOS elementos anidados. Devuelve el estilo de cada uno:
//
//   `frame` — el ribete, un borde sólido del color que fija la zona.
//   `fill`  — el tejido de `RUG_TEXTURES`, dentro del ribete.
//
// Van separados por el `filter`. El filtro es del TEJIDO, no de la alfombra
// entera: si se aplicara al elemento del ribete, el sepia de la casa de
// montaña o el grayscale del apartamento arrastrarían también el color del
// ribete y la zona dejaría de poder elegirlo — que es justo lo que hace que
// se lea como una cinta cosida al borde y no como un recorte más de la
// misma tela. Anidados, cada capa recibe solo lo suyo.
//
// El grosor y el radio son proporcionales a la celda, no fijos: así el
// ribete no queda desproporcionado en un tablero grande ni desaparece en
// uno pequeño. `radiusFrac: 0` deja la esquina en pico — es lo que quiere la
// mansión 8-bit, donde una curva delataría que no es pixel art. El radio
// interior descuenta el grosor del ribete para que las dos curvas sean
// concéntricas; si el ribete es más ancho que el radio, sale 0 y el tejido
// queda en pico dentro de una cinta redondeada, que es lo correcto.
//
// El tile se escala con la celda, no a tamaño fijo: un periodo constante se
// convierte en ruido cuando el tablero se comprime a 36 px en móvil (mismo
// criterio que los materiales de suelo).
export function rugLayerStyles(zone, cellSize) {
  const border = Math.max(3, Math.round(cellSize * zone.rug.borderFrac))
  const radius = Math.round(cellSize * zone.rug.radiusFrac)
  const tex = RUG_TEXTURES[zone.rug.texture]
  const t = Math.max(24, Math.round(cellSize / tex.tileDiv))
  return {
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

// Fábrica de bordes de celda: muro exterior del tablero, muro entre
// habitaciones y línea interior de rejilla, con los colores y grosores de la
// zona. `scale` adelgaza los trazos en la miniatura (el tablero usa 1). Un
// grosor de 0 px produce 'none', que es como el apartamento prescinde de la
// rejilla interior — allí la junta de la baldosa ya hace ese papel.
export function makeBordersFor(map, roomLookup, size, zone, scale = 1) {
  const px = (n) => Math.max(1, Math.round(n * scale))
  const OUTER = `${px(zone.wall.outerPx)}px solid ${zone.wall.color}`
  const ROOM = `${px(zone.wall.roomPx)}px solid ${zone.wall.color}`
  const THIN = zone.wall.thinPx <= 0 ? 'none' : `${px(zone.wall.thinPx)}px solid ${zone.wall.thinColor}`

  return (r, c) => {
    const room = roomLookup[`${r},${c}`]
    const sideBorder = (nr, nc) => {
      // Fuera del tablero o celda void (mapa irregular): muro exterior.
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) return OUTER
      if (map.voidCells?.has(`${nr},${nc}`)) return OUTER
      if (roomLookup[`${nr},${nc}`] !== room) return ROOM
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
