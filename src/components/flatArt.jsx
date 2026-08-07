// Emisor de "arte plano": el equivalente vectorial de `PixelGrid`, para las
// zonas que no son pixel art.
//
// Un descriptor (ver flatSprites*.js) es un `viewBox` cuadrado, una paleta de
// 2-3 tintas y una lista de primitivas. El único canal de color es un índice de
// paleta, así que el formato NO PUEDE expresar un degradado, una sombra ni una
// textura: la regla "vectorial plano" queda garantizada por construcción y no
// depende de que cada objeto nuevo la respete por convención.
//
// A diferencia de `PixelGrid`, aquí no se fija `shapeRendering`: el pixel art
// quiere `crispEdges`, el vector plano quiere el suavizado por defecto para que
// las curvas y las esquinas redondeadas no queden dentadas.

export function FlatShape({ shape, size = 24, className, style }) {
  const { viewBox, palette, parts } = shape
  return (
    <svg
      viewBox={`0 0 ${viewBox} ${viewBox}`}
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
    >
      {parts.map((part, i) => {
        const fill = palette[part.c]
        if (part.rect) {
          const [x, y, w, h, rx] = part.rect
          return <rect key={i} x={x} y={y} width={w} height={h} rx={rx} fill={fill} />
        }
        if (part.circle) {
          const [cx, cy, r] = part.circle
          return <circle key={i} cx={cx} cy={cy} r={r} fill={fill} />
        }
        return <path key={i} d={part.path} fill={fill} />
      })}
    </svg>
  )
}
