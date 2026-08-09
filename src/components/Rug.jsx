// Alfombra del tablero: UNA capa rectangular, no una por celda —dibujarla por
// celda obligaría a resolver a mano qué canto es borde y cuál interior. Cubre
// el rectángulo que ocupe (de 1×6 a 3×2, ver `placeRug` en mapGenerator.js);
// las celdas que caen dentro solo dejan su fondo transparente (Cell.jsx).
//
// Tres capas: el suelo de la habitación (rectángulo entero), el ribete
// (separado del canto por `inset`) y el tejido (dentro del ribete). El suelo
// va primero y cubre TODO porque las celdas de abajo son transparentes: sin
// él, la franja de `inset` y los huecos de las esquinas redondeadas darían al
// vacío del tablero. Ribete y tejido van en elementos separados porque el
// `filter` de la zona es solo del tejido (ver `rugLayerStyles`, boardCell.js).
//
// El tablero y la miniatura comparten este componente con otro `cellSize`;
// `offsetX` es el canalón de numeración de filas que solo tiene el tablero.

import { floorPatternStyle, rugLayerStyles } from './boardCell.js'

export function Rug({ zone, cellSize, bounds, roomName, tint, offsetX = 0 }) {
  const { inset, frame, fill } = rugLayerStyles(zone, cellSize)
  return (
    <div
      className="absolute"
      style={{
        top: bounds.r0 * cellSize,
        left: offsetX + bounds.c0 * cellSize,
        width: (bounds.c1 - bounds.c0 + 1) * cellSize,
        height: (bounds.r1 - bounds.r0 + 1) * cellSize,
        background: tint,
      }}
    >
      {/* El rectángulo empieza en un canto de celda, así que el material de
          suelo cae en la misma fase que el de las celdas vecinas y la junta
          sigue de largo por debajo de la alfombra sin dar un salto. */}
      <div className="absolute inset-0" style={floorPatternStyle(zone, roomName, cellSize)} />
      <div className="absolute box-border" style={{ inset, ...frame }}>
        <div className="absolute inset-0" style={fill} />
      </div>
    </div>
  )
}
