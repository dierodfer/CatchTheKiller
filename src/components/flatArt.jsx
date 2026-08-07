// Emisor de arte vectorial: dibuja un icono de Material Symbols con la tinta de
// la zona. Es el equivalente no-pixelado de `PixelGrid`.
//
// Los iconos son de un solo color por diseño del set (un trazado por símbolo),
// así que la ambientación se expresa aquí con la TINTA; el resto —paleta de la
// sala, suelo, muros, ventanas— lo aporta la zona alrededor.
//
// A diferencia de `PixelGrid` no se fija `shapeRendering`: el pixel art quiere
// `crispEdges` y el vector quiere el suavizado por defecto.

import { MATERIAL_SYMBOLS, MS_VIEWBOX } from './materialSymbols.js'

export function FlatShape({ name, ink, size = 24, className }) {
  const paths = MATERIAL_SYMBOLS[name]
  if (!paths) return null
  return (
    <svg
      viewBox={MS_VIEWBOX}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill={ink} />
      ))}
    </svg>
  )
}
