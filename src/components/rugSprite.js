// Sprite de alfombra — recortado de "Roguelike/RPG pack" (Kenney, CC0 1.0).
//
// Bloque de 3×3 tiles de 16 px reensamblado en una sola imagen de 48×48, sin
// los gutters de 1 px del spritesheet original: un marco continuo, sin
// costuras, listo para `border-image`. Licencia CC0: texto de cortesía en
// `LICENSES/kenney-roguelike-rpg-pack-CC0.txt` (la CC0 no exige atribución).
//
// Por qué `border-image` y no un fondo repetido: la alfombra puede salir en
// cualquier forma rectangular, de 1×2 a 6×1 pasando por bloques de 3×2 (ver
// `placeRug` en game/mapGenerator.js). `border-image-slice` divide esta
// imagen en 9 regiones — 4 esquinas de tamaño fijo, 4 bordes que se estiran
// en un solo eje y un centro que se estira en los dos — así el marco nunca se
// deforma sea cual sea el tamaño final, sin necesidad de recortar un sprite
// distinto por celda ni resolver a mano el caso de una tira de 1 celda de
// ancho (donde no hay una fila/columna "central" que sirva de banda recta).
//
// Se renderiza como UNA sola capa a nivel de tablero (ver Board.jsx), no por
// celda — ver el comentario de `rugBounds` en useBoardGeometry.js.

export const RUG_SPRITE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAA0UlEQVR4AdXBsW3CABRF0eunX2IpVTYwGzCCV2APT+I9WMEjZIN4Ayokp3dSEAkhCGV8z2nWdcUsyBVXnx+nFZH94djwo7jRvr1jsFzO/CruDPPElo1dz63igbHr2aJhnrhXPDHME1sydj2PBLniha9l4T/t2pa/BLkgF+SCXJALckEuyAW5IBfkglyQC3JBLsgFuSAX5IJckAtyQS7IBbkgF+SCXJALckGueGHXtmxZkCueGLseg+KBYZ6wKO6MXY9JcWO5nLEprvaHY4NQkPsGGc4eExv239sAAAAASUVORK5CYII='
