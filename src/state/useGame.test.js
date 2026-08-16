// Máquina de estados de la partida. Se prueba el reducer directamente: es una
// función pura, así que no hace falta montar React para cubrir las reglas que
// de verdad importan.
//
// Lo que se busca aquí no es cobertura por cobertura, sino las invariantes que
// romperían una partida en curso y que ningún tipo ni lint detectaría: que una
// casilla no acabe con dos fichas, que las anotaciones no dejen entradas
// vacías, y que revelar o reiniciar no arrastren estado de la partida anterior.

import { describe, it, expect } from 'vitest'
import { reducer, initialState, STATUS } from './useGame.js'

// Puzzle mínimo: el reducer solo lee de él lo que se declara abajo, así que un
// objeto real de `generatePuzzle` (que tarda cientos de ms) no aporta nada.
const puzzle = {
  difficulty: 'novato',
  irregular: false,
  seed: 1234,
  characters: { suspects: ['Alba', 'Carla'], victim: 'Sergio' },
  solution: {
    Alba: { row: 0, col: 0 },
    Carla: { row: 1, col: 1 },
    Sergio: { row: 2, col: 2 },
  },
  killer: 'Alba',
  roomLookup: { '2,2': 'Cocina' },
  extraClues: [],
  extraClueBudget: 2,
}

const playing = { ...initialState, status: STATUS.PLAYING, puzzle }

describe('colocación de fichas', () => {
  it('coloca una ficha en la casilla indicada', () => {
    const s = reducer(playing, { type: 'PLACE', name: 'Alba', row: 1, col: 2 })
    expect(s.placements).toEqual({ Alba: { row: 1, col: 2 } })
  })

  it('desaloja a quien ya ocupaba la casilla', () => {
    let s = reducer(playing, { type: 'PLACE', name: 'Alba', row: 1, col: 2 })
    s = reducer(s, { type: 'PLACE', name: 'Carla', row: 1, col: 2 })
    // Dos fichas en la misma celda dejarían el tablero en un estado que la
    // regla del asesino no sabe evaluar: Alba tiene que salir.
    expect(s.placements).toEqual({ Carla: { row: 1, col: 2 } })
  })

  it('mover una ficha no la duplica', () => {
    let s = reducer(playing, { type: 'PLACE', name: 'Alba', row: 0, col: 0 })
    s = reducer(s, { type: 'PLACE', name: 'Alba', row: 3, col: 3 })
    expect(s.placements).toEqual({ Alba: { row: 3, col: 3 } })
  })

  it('quita una ficha sin tocar las demás', () => {
    let s = reducer(playing, { type: 'PLACE', name: 'Alba', row: 0, col: 0 })
    s = reducer(s, { type: 'PLACE', name: 'Carla', row: 1, col: 1 })
    s = reducer(s, { type: 'UNPLACE', name: 'Alba' })
    expect(s.placements).toEqual({ Carla: { row: 1, col: 1 } })
  })

  it('invalida el resultado anterior al mover ficha', () => {
    // Si no se limpiara, tras un FAIL el jugador seguiría viendo el recuento
    // de errores de una colocación que ya ha cambiado.
    const failed = { ...playing, result: { solved: false, errorCount: 3 } }
    expect(reducer(failed, { type: 'PLACE', name: 'Alba', row: 0, col: 0 }).result).toBeNull()
    expect(reducer(failed, { type: 'UNPLACE', name: 'Alba' }).result).toBeNull()
  })
})

describe('anotaciones de candidatos', () => {
  const mark = (s, name) => reducer(s, { type: 'TOGGLE_MARK', row: 1, col: 1, name })

  it('alterna un nombre en la casilla', () => {
    const s = mark(playing, 'Alba')
    expect(s.marks).toEqual({ '1,1': ['Alba'] })
  })

  it('borra la entrada al quitar la última marca, no deja un array vacío', () => {
    // Una entrada vacía sobreviviría al guardado y haría que `CandidateMarks`
    // renderizara un contenedor sin contenido sobre la casilla.
    const s = mark(mark(playing, 'Alba'), 'Alba')
    expect(s.marks).toEqual({})
    expect('1,1' in s.marks).toBe(false)
  })

  it('acumula varios candidatos en la misma casilla', () => {
    const s = mark(mark(playing, 'Alba'), 'Carla')
    expect(s.marks['1,1']).toEqual(['Alba', 'Carla'])
  })
})

describe('testimonios descartados', () => {
  it('alterna el sujeto', () => {
    let s = reducer(playing, { type: 'TOGGLE_STRUCK_CLUE', subject: 'Alba' })
    expect(s.struckClues).toEqual(['Alba'])
    s = reducer(s, { type: 'TOGGLE_STRUCK_CLUE', subject: 'Alba' })
    expect(s.struckClues).toEqual([])
  })
})

describe('revelar la solución', () => {
  it('coloca la solución completa y marca la partida como ganada', () => {
    const s = reducer(playing, { type: 'REVEAL' })
    expect(s.status).toBe(STATUS.WIN)
    expect(s.placements).toEqual(puzzle.solution)
    expect(s.result).toMatchObject({ solved: true, revealed: true, killer: 'Alba' })
  })

  it('informa de la habitación del crimen (la de la víctima)', () => {
    // La víctima está en 2,2 y esa celda es la Cocina.
    expect(reducer(playing, { type: 'REVEAL' }).result.room).toBe('Cocina')
  })
})

describe('pistas adicionales', () => {
  const withPool = {
    ...playing,
    puzzle: {
      ...puzzle,
      extraClues: [
        { kind: 'inRoom', subject: 'Alba', params: { room: 'Cocina' } },
        { kind: 'inRoom', subject: 'Carla', params: { room: 'Cocina' } },
      ],
      extraClueBudget: 1,
    },
  }

  it('concede una pista y la registra', () => {
    const s = reducer(withPool, { type: 'REQUEST_EXTRA_CLUE' })
    expect(s.revealedExtraIds).toHaveLength(1)
  })

  it('no pasa del presupuesto de la dificultad', () => {
    let s = reducer(withPool, { type: 'REQUEST_EXTRA_CLUE' })
    s = reducer(s, { type: 'REQUEST_EXTRA_CLUE' })
    expect(s.revealedExtraIds).toHaveLength(1)
  })

  it('sin puzzle no hace nada', () => {
    const s = reducer(initialState, { type: 'REQUEST_EXTRA_CLUE' })
    expect(s).toBe(initialState)
  })
})

describe('ciclo de vida de la partida', () => {
  it('NEW_GAME limpia el tablero pero conserva las preferencias', () => {
    const dirty = {
      ...playing,
      difficulty: 'experto',
      irregular: false,
      placements: { Alba: { row: 0, col: 0 } },
      marks: { '1,1': ['Carla'] },
      struckClues: ['Alba'],
    }
    const s = reducer(dirty, { type: 'NEW_GAME' })
    expect(s.placements).toEqual({})
    expect(s.marks).toEqual({})
    expect(s.struckClues).toEqual([])
    expect(s.puzzle).toBeNull()
    // La dificultad y el toggle son ajustes del jugador, no de la partida.
    expect(s.difficulty).toBe('experto')
    expect(s.irregular).toBe(false)
  })

  it('GENERATE_SUCCESS no arrastra estado de la partida anterior', () => {
    const dirty = { ...playing, marks: { '1,1': ['Alba'] }, struckClues: ['Carla'] }
    const s = reducer(dirty, { type: 'GENERATE_SUCCESS', puzzle })
    expect(s.marks).toEqual({})
    expect(s.struckClues).toEqual([])
    expect(s.status).toBe(STATUS.PLAYING)
  })

  it('GENERATE_SUCCESS acepta fichas precolocadas (partida compartida)', () => {
    const initialPlacements = { Alba: { row: 2, col: 3 } }
    const s = reducer(initialState, { type: 'GENERATE_SUCCESS', puzzle, initialPlacements })
    expect(s.placements).toEqual(initialPlacements)
  })

  it('RESTORE_GAME conserva las anotaciones y las pistas ya reveladas', () => {
    const s = reducer(initialState, {
      type: 'RESTORE_GAME',
      puzzle,
      status: STATUS.PLAYING,
      placements: { Alba: { row: 0, col: 0 } },
      marks: { '1,1': ['Carla'] },
      struckClues: ['Alba'],
      revealedExtraIds: ['x'],
    })
    // A diferencia de GENERATE_SUCCESS, reanudar sí recupera el progreso.
    expect(s.marks).toEqual({ '1,1': ['Carla'] })
    expect(s.revealedExtraIds).toEqual(['x'])
  })

  it('CHECK pasa a WIN o a FAIL según el resultado', () => {
    expect(reducer(playing, { type: 'CHECK', result: { solved: true } }).status).toBe(STATUS.WIN)
    expect(reducer(playing, { type: 'CHECK', result: { solved: false } }).status).toBe(STATUS.FAIL)
  })

  it('una acción desconocida devuelve el mismo estado', () => {
    expect(reducer(playing, { type: 'NO_EXISTE' })).toBe(playing)
  })
})
