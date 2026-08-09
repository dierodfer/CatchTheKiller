// Geometría por celda: lo que hay que saber de una casilla para dibujarla,
// derivado del mapa y de la zona, sin nada del estado de la partida.
//
// Lo comparten el TABLERO (vía useBoardGeometry) y la MINIATURA de la pantalla
// de inicio (MapPreview). Antes cada uno lo calculaba por su cuenta, con el
// mismo bucle escrito dos veces, y eso ya costó dos fallos: al rehacer la
// alfombra y al quitar la rejilla interior hubo que acordarse de tocar los dos
// sitios, y la miniatura se quedó atrás en ambos casos.
//
// Lo que cambia entre ambos NO es el cálculo, solo dos parámetros:
//
//   `cellSize`    — el tablero lo deriva del ancho de la ventana; la miniatura
//                   lo tiene fijo por dificultad.
//   `borderScale` — adelgaza los muros en la miniatura (0.6), donde 5 px de
//                   muro sobre una celda de 32 se comerían la casilla.
//
// Es una función pura, no un hook: quien la usa la memoiza con sus propias
// dependencias (el tablero recalcula al redimensionar, la miniatura no).

import { isOccupiable } from '@/game/mapGenerator.js'
import { cellKey } from '@/game/constants.js'
import { makeBordersFor } from './boardCell.js'
import { roomIndexByName } from './floorMaterials.js'

// Celda que muestra el rótulo de cada habitación: la primera en orden de
// lectura. El rótulo es el nombre que la ZONA da a esa sala (`zone.rooms`), no
// el canónico — la misma "Terraza" se lee "Porche" o "Balcón" según la
// ambientación, sin dejar de ser la misma sala a efectos de tinte y material.
function labelCells(map, zone) {
  const labels = {}
  for (const room of map.rooms) {
    const [r, c] = [...room.cells].sort((a, b) => a[0] - b[0] || a[1] - b[1])[0]
    labels[cellKey(r, c)] = zone.rooms[room.name].label
  }
  return labels
}

export function buildCellGeometry({ map, roomLookup, zone, cellSize, borderScale = 1 }) {
  const size = map.gridSize
  const windowByCell = {}
  for (const w of map.windows) windowByCell[cellKey(w.row, w.col)] = w.wall

  const labels = labelCells(map, zone)
  const bordersFor = makeBordersFor(map, roomLookup, size, zone, borderScale)

  const grid = []
  for (let r = 0; r < size; r++) {
    const row = []
    for (let c = 0; c < size; c++) {
      const key = cellKey(r, c)
      // Celda void (mapa irregular): hueco no jugable, se pinta como exterior.
      if (map.voidCells?.has(key)) {
        row.push({ r, c, size: cellSize, isVoid: true, occupiable: false })
        continue
      }
      const roomName = roomLookup[key]
      row.push({
        r,
        c,
        size: cellSize,
        roomName,
        // Tinte indexado por el NOMBRE de la sala, no por el orden en que el
        // generador la creó: así la Cocina sale siempre del mismo tono, a
        // juego con su suelo de baldosa.
        tint: zone.tints[roomIndexByName(roomName) % zone.tints.length],
        borders: bordersFor(r, c),
        label: labels[key],
        furniture: map.grid[r][c],
        isWindow: key in windowByCell,
        wall: windowByCell[key],
        occupiable: isOccupiable(map, r, c),
      })
      }
    grid.push(row)
  }
  return grid
}

// Tinte de la sala donde cae la alfombra. Vive aquí y no en Rug.jsx porque la
// alfombra se pinta como una capa única fuera del bucle de celdas, así que
// necesita el tinte por su cuenta — pero tiene que ser exactamente el mismo
// que el de sus casillas, o el suelo que asoma por el borde daría un salto.
export function rugTintOf(zone, roomLookup, bounds) {
  if (!bounds) return null
  const roomName = roomLookup[cellKey(bounds.r0, bounds.c0)]
  return zone.tints[roomIndexByName(roomName) % zone.tints.length]
}
