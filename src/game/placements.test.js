// Validación de fichas y anotaciones que llegan de FUERA: un código compartido
// por un tercero o una partida guardada en localStorage que puede haber
// quedado obsoleta (o que alguien ha editado a mano).
//
// Es la frontera de confianza de la app, así que lo que se prueba aquí es
// justo el caso hostil: datos corruptos, de otro puzzle o directamente
// inventados. La regla es que nada de eso puede tumbar la partida — se
// descarta lo inválido y se sigue.

import { describe, it, expect } from 'vitest'
import { clueId } from './clues.js'
import {
  filterValidPlacements,
  filterValidMarks,
  filterValidStruckClues,
  filterValidRevealedExtras,
} from './placements.js'

// Mapa 3×3 sin celdas void; (1,1) lleva un elemento bloqueante y no es ocupable.
const puzzle = {
  map: {
    gridSize: 3,
    grid: [
      [null, null, null],
      [null, 'planta', null],
      [null, null, null],
    ],
    voidCells: new Set(),
  },
  characters: { suspects: ['Alba', 'Carla'], victim: 'Sergio' },
  extraClues: [{ kind: 'inRoom', subject: 'Alba', params: { room: 'Cocina' } }],
  extraClueBudget: 1,
}

describe('filterValidPlacements', () => {
  it('conserva una colocación válida', () => {
    expect(filterValidPlacements({ Alba: { row: 0, col: 0 } }, puzzle)).toEqual({
      Alba: { row: 0, col: 0 },
    })
  })

  it('descarta celdas no ocupables', () => {
    expect(filterValidPlacements({ Alba: { row: 1, col: 1 } }, puzzle)).toEqual({})
  })

  it('descarta coordenadas fuera del tablero', () => {
    const raw = { Alba: { row: 9, col: 0 }, Carla: { row: -1, col: 0 } }
    expect(filterValidPlacements(raw, puzzle)).toEqual({})
  })

  it('descarta entradas malformadas', () => {
    const raw = { Alba: null, Carla: { row: '0', col: 0 }, Sergio: {} }
    expect(filterValidPlacements(raw, puzzle)).toEqual({})
  })

  it('con dos fichas en la misma celda se queda solo con la primera', () => {
    const raw = { Alba: { row: 0, col: 0 }, Carla: { row: 0, col: 0 } }
    expect(filterValidPlacements(raw, puzzle)).toEqual({ Alba: { row: 0, col: 0 } })
  })

  it('tolera undefined', () => {
    expect(filterValidPlacements(undefined, puzzle)).toEqual({})
  })
})

describe('filterValidMarks', () => {
  it('descarta nombres que no son del reparto', () => {
    const raw = { '0,0': ['Alba', 'Fulano'] }
    expect(filterValidMarks(raw, puzzle)).toEqual({ '0,0': ['Alba'] })
  })

  it('elimina la entrada si no queda ningún nombre válido', () => {
    expect(filterValidMarks({ '0,0': ['Fulano'] }, puzzle)).toEqual({})
  })

  it('ignora valores que no son lista', () => {
    expect(filterValidMarks({ '0,0': 'Alba' }, puzzle)).toEqual({})
  })

  it('acepta a la víctima como candidata', () => {
    // La víctima también se coloca, así que anotarla es legítimo.
    expect(filterValidMarks({ '0,0': ['Sergio'] }, puzzle)).toEqual({ '0,0': ['Sergio'] })
  })

  it('tolera null', () => {
    expect(filterValidMarks(null, puzzle)).toEqual({})
  })
})

describe('filterValidStruckClues', () => {
  it('se queda solo con nombres del reparto', () => {
    expect(filterValidStruckClues(['Alba', 'Fulano'], puzzle)).toEqual(['Alba'])
  })

  it('tolera que no sea una lista', () => {
    expect(filterValidStruckClues('Alba', puzzle)).toEqual([])
  })
})

describe('filterValidRevealedExtras', () => {
  // Derivado de la pista real con `clueId`, no escrito a mano: un id inventado
  // haría que estos tests pasaran sin comprobar nada, porque todo id que no
  // esté en el pool se descarta y el resultado sería [] de todas formas.
  const validId = clueId(puzzle.extraClues[0])

  it('conserva un id que sigue en el pool', () => {
    expect(filterValidRevealedExtras([validId], puzzle)).toEqual([validId])
  })

  it('descarta ids que ya no existen en el pool regenerado', () => {
    expect(filterValidRevealedExtras(['no-existe'], puzzle)).toEqual([])
  })

  it('recorta al presupuesto de la dificultad', () => {
    expect(filterValidRevealedExtras([validId], { ...puzzle, extraClueBudget: 0 })).toEqual([])
  })

  it('elimina duplicados', () => {
    const out = filterValidRevealedExtras([validId, validId], { ...puzzle, extraClueBudget: 5 })
    expect(out).toEqual([validId])
  })

  it('tolera que no sea una lista', () => {
    expect(filterValidRevealedExtras(undefined, puzzle)).toEqual([])
  })
})
