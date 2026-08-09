// Geometría compartida por el tablero y la miniatura.
//
// El test que de verdad importa aquí es el último: que ambos consumidores
// obtengan la MISMA geometría salvo por el tamaño y el grosor de muro. Es la
// invariante que se rompía cuando cada uno calculaba lo suyo por su cuenta, y
// la que hizo que la miniatura se quedara atrás dos veces.

import { describe, it, expect } from 'vitest'
import { buildCellGeometry, rugTintOf } from './cellGeometry.js'
import { ZONES } from './zones.js'

const zone = ZONES.montana

// Mapa 2×2: una sala de tres celdas y un hueco void en (1,1).
const map = {
  gridSize: 2,
  grid: [
    [null, 'mesa'],
    ['alfombra', null],
  ],
  rooms: [{ name: 'Cocina', cells: [[0, 1], [0, 0], [1, 0]] }],
  windows: [{ row: 0, col: 1, wall: 'norte' }],
  voidCells: new Set(['1,1']),
}
const roomLookup = { '0,0': 'Cocina', '0,1': 'Cocina', '1,0': 'Cocina' }

const build = (over = {}) =>
  buildCellGeometry({ map, roomLookup, zone, cellSize: 80, ...over })

describe('buildCellGeometry', () => {
  it('devuelve una rejilla del tamaño del mapa', () => {
    const grid = build()
    expect(grid).toHaveLength(2)
    expect(grid[0]).toHaveLength(2)
  })

  it('marca las celdas void como no jugables', () => {
    const cell = build()[1][1]
    expect(cell.isVoid).toBe(true)
    expect(cell.occupiable).toBe(false)
  })

  it('rotula la habitación en su primera celda en orden de lectura', () => {
    // La sala se declara con las celdas desordenadas a propósito: el rótulo
    // debe caer en (0,0), no en la primera que aparezca en la lista.
    const grid = build()
    expect(grid[0][0].label).toBe('Cocina')
    expect(grid[0][1].label).toBeUndefined()
    expect(grid[1][0].label).toBeUndefined()
  })

  it('usa el nombre que la zona da a la sala, no el canónico', () => {
    // En la casa de montaña el Estudio es la Armería (ver ZONE_ROOMS).
    const conEstudio = buildCellGeometry({
      map: { ...map, rooms: [{ name: 'Estudio', cells: [[0, 0]] }] },
      roomLookup: { '0,0': 'Estudio' },
      zone,
      cellSize: 80,
    })
    expect(conEstudio[0][0].label).toBe('Armería')
  })

  it('marca la celda con ventana y su pared', () => {
    const cell = build()[0][1]
    expect(cell.isWindow).toBe(true)
    expect(cell.wall).toBe('norte')
  })

  it('una celda con elemento bloqueante no es ocupable', () => {
    // 'mesa' es blocking; 'alfombra' es pisable.
    expect(build()[0][1].occupiable).toBe(false)
    expect(build()[1][0].occupiable).toBe(true)
  })

  it('todas las celdas de una sala comparten tinte', () => {
    const grid = build()
    expect(grid[0][0].tint).toBe(grid[0][1].tint)
    expect(grid[0][0].tint).toBe(grid[1][0].tint)
  })

  it('propaga el tamaño de celda recibido', () => {
    expect(build({ cellSize: 32 })[0][0].size).toBe(32)
  })
})

describe('tablero y miniatura comparten geometría', () => {
  // Es la razón de ser de este módulo: la miniatura solo puede diferir en el
  // tamaño de celda y en el grosor del muro. Cualquier otra diferencia
  // significa que las dos vistas han vuelto a divergir.
  const tablero = buildCellGeometry({ map, roomLookup, zone, cellSize: 80 })
  const miniatura = buildCellGeometry({
    map,
    roomLookup,
    zone,
    cellSize: 32,
    borderScale: 0.6,
  })

  // Todo lo que NO puede diferir entre las dos vistas.
  const sinTamañoNiBordes = (cell) => {
    const resto = { ...cell }
    delete resto.size
    delete resto.borders
    return resto
  }

  it('coinciden en todo salvo el tamaño y los bordes', () => {
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        expect(sinTamañoNiBordes(miniatura[r][c])).toEqual(sinTamañoNiBordes(tablero[r][c]))
      }
    }
  })

  it('la miniatura sí adelgaza el muro', () => {
    expect(miniatura[0][0].borders.top).not.toBe(tablero[0][0].borders.top)
  })
})

describe('rugTintOf', () => {
  it('devuelve el tinte de la sala donde cae la alfombra', () => {
    const bounds = { r0: 1, c0: 0, r1: 1, c1: 0 }
    // Debe ser exactamente el de su celda: si no, el suelo que asoma por el
    // margen de la alfombra daría un salto de color.
    expect(rugTintOf(zone, roomLookup, bounds)).toBe(build()[1][0].tint)
  })

  it('sin alfombra devuelve null', () => {
    expect(rugTintOf(zone, roomLookup, null)).toBeNull()
  })
})
