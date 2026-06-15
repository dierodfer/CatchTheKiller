// Primitivas de dibujo compartidas por Cell (tablero de juego) y MapPreview
// (miniatura de la pantalla inicial): marco de ventana, cristal, suelo a
// baldosas y las dos capas de la alfombra. Centralizar esto evita que ambos
// componentes dupliquen constantes y cálculos (y se desincronicen).

import { RUG_PATTERN, RUG_NOISE, RUG_NOISE_SIZE } from './rugPattern.js'
import { PIXEL_FLOOR_PATTERN } from './pixelSprites.js'

// Color del marco de ventana (estilo plano técnico) y del cristal.
export const WINDOW_FRAME_COLOR = '#6f9bc9'
export const WINDOW_GLASS_COLOR = '#eaf3fb'

// Tinte dorado y contornos del tablero (resaltado de revelado, soltar ficha).
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

// Marco de ventana, parametrizado por grosor en px (tablero 5, preview 3).
export const windowBorder = (px) => `${px}px solid ${WINDOW_FRAME_COLOR}`

// Estilo del cristal pegado a la pared. `inset` separa el cristal de las
// esquinas (px); su grosor es fijo (~2px).
export function windowGlassStyle(wall, inset) {
  const T = 2
  switch (wall) {
    case 'norte':
      return { left: inset, right: inset, top: T, height: T }
    case 'sur':
      return { left: inset, right: inset, bottom: T, height: T }
    case 'oeste':
      return { top: inset, bottom: inset, left: T, width: T }
    case 'este':
      return { top: inset, bottom: inset, right: T, width: T }
    default:
      return {}
  }
}

// Estilo del suelo a baldosas (damero superpuesto al tinte de la habitación).
export function floorPatternStyle(size) {
  const tile = Math.max(4, Math.round(size / 4))
  return {
    backgroundImage: PIXEL_FLOOR_PATTERN,
    backgroundSize: `${tile}px ${tile}px`,
    mixBlendMode: 'soft-light',
    opacity: 0.55,
  }
}

// Estilos de las dos capas de la alfombra (trama + dither) dados los bordes
// (qué lados son frontera de la alfombra), el margen y el radio de esquina.
export function rugLayerStyles(edges, margin, radius = 8) {
  const box = {
    top: edges.top ? margin : 0,
    right: edges.right ? margin : 0,
    bottom: edges.bottom ? margin : 0,
    left: edges.left ? margin : 0,
    borderTopLeftRadius: edges.top && edges.left ? radius : 0,
    borderTopRightRadius: edges.top && edges.right ? radius : 0,
    borderBottomLeftRadius: edges.bottom && edges.left ? radius : 0,
    borderBottomRightRadius: edges.bottom && edges.right ? radius : 0,
  }
  return [
    { ...box, background: RUG_PATTERN, opacity: 0.85 },
    {
      ...box,
      backgroundImage: RUG_NOISE,
      backgroundSize: RUG_NOISE_SIZE,
      mixBlendMode: 'soft-light',
      opacity: 0.25,
    },
  ]
}
