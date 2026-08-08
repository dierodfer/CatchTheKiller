// Alfombra del tablero: UNA capa rectangular, no una por celda.
//
// La alfombra puede salir en cualquier forma —de una tira de 1×6 a un bloque
// de 3×2, ver `placeRug` en game/mapGenerator.js—, así que se dibuja de una
// pieza sobre el rectángulo completo (`rugBoundsOf`) y las celdas que caen
// dentro se limitan a dejar su fondo transparente (ver Cell.jsx). Dibujarla
// por celda obligaría a resolver a mano qué canto es borde y cuál interior.
//
// Son TRES capas apiladas, y el orden importa:
//
//   1. el suelo de la habitación,
//   2. el ribete,
//   3. el tejido, dentro del ribete.
//
// La primera existe por las esquinas redondeadas. Las celdas de debajo van
// transparentes —pintan después que esta capa, cualquier fondo suyo taparía
// la alfombra—, así que sin ella los cuatro huecos que deja la curva darían
// al vacío del tablero en vez de al suelo de la sala, y la alfombra se leería
// recortada contra un agujero en lugar de apoyada encima. Es el suelo de la
// habitación, no uno genérico: la alfombra siempre cae dentro de una sola
// sala, así que basta con el material y el tinte de esa.
//
// Las capas 2 y 3 van separadas porque el `filter` de la zona es solo del
// tejido; el porqué está en `rugLayerStyles` (boardCell.js).
//
// El tablero y la miniatura la comparten: el mismo componente con otro
// `cellSize`. `offsetX` existe porque el tablero reserva un canalón a la
// izquierda para los números de fila y la miniatura no.

import { floorPatternStyle, rugLayerStyles } from './boardCell.js'

export function Rug({ zone, cellSize, bounds, roomName, tint, offsetX = 0 }) {
  const { frame, fill } = rugLayerStyles(zone, cellSize)
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
      <div className="absolute inset-0 box-border" style={frame}>
        <div className="absolute inset-0" style={fill} />
      </div>
    </div>
  )
}
