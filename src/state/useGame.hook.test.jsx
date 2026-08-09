// @vitest-environment jsdom
//
// Los tres caminos que arrancan una partida (nueva, código compartido, partida
// guardada). `useGame.test.js` cubre el reducer; lo que falta —y es justo lo
// que cambió al mover la generación a un Web Worker— es el pegamento asíncrono:
// que el spinner se encienda sin esperar a nadie, que un fallo llegue a la
// pantalla con su mensaje, y que dos peticiones solapadas no se pisen.
//
// El cliente del worker va mockeado: aquí no se prueba el worker (eso es
// `workers/puzzleClient.test.js`), sino qué hace el hook con lo que devuelve.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { encodeShareCode } from '@/game/shareCode.js'

const runner = vi.hoisted(() => ({
  requests: [],
  pending: [],
  disposeCount: 0,
}))

vi.mock('@/workers/puzzleClient.js', async (importOriginal) => ({
  // La clase de "petición reemplazada" es la de verdad: el hook la distingue
  // con `instanceof`, así que un doble rompería justo lo que se quiere probar.
  ...(await importOriginal()),
  createPuzzleRunner: () => ({
    generate(request) {
      runner.requests.push(request)
      return new Promise((resolve, reject) => runner.pending.push({ resolve, reject }))
    },
    isBusy: () => runner.pending.length > 0,
    dispose: () => runner.disposeCount++,
  }),
}))

vi.mock('./gameStorage.js', () => ({
  saveGame: vi.fn(),
  loadSavedGame: vi.fn(),
  clearSavedGame: vi.fn(),
}))

const { clearSavedGame } = await import('./gameStorage.js')
const { useGame, STATUS } = await import('./useGame.js')
const { PuzzleRequestSuperseded } = await import('@/workers/puzzleClient.js')

const GRID = 4

// Puzzle mínimo pero con mapa real: `filterValidPlacements` consulta
// `isOccupiable`, así que la rejilla tiene que existir de verdad.
const makePuzzle = (over = {}) => ({
  seed: 7,
  difficulty: 'facil',
  irregular: false,
  map: {
    gridSize: GRID,
    grid: Array.from({ length: GRID }, () => Array(GRID).fill(null)),
    voidCells: new Set(),
  },
  roomLookup: {},
  characters: { suspects: ['Alba', 'Carla'], victim: 'Sergio' },
  clues: [],
  extraClues: [],
  extraClueBudget: 0,
  solution: {},
  killer: 'Alba',
  ...over,
})

// Responde a la petición que esté en cola, dejando que React procese el
// dispatch resultante.
const resolveNext = (puzzle) =>
  act(async () => {
    runner.pending.shift().resolve(puzzle)
  })

const rejectNext = (error) =>
  act(async () => {
    runner.pending.shift().reject(error)
  })

beforeEach(() => {
  runner.requests.length = 0
  runner.pending.length = 0
  runner.disposeCount = 0
  vi.clearAllMocks()
})

describe('generate', () => {
  it('enciende el spinner sin esperar a nada', () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.generate()
    })
    // Antes había un `setTimeout(30)` para pintar el spinner antes de bloquear
    // el hilo. Ya no bloquea nadie, así que GENERATING es inmediato: si alguien
    // reintrodujera el retardo, este test lo caza sin tocar los timers.
    expect(result.current.state.status).toBe(STATUS.GENERATING)
    expect(runner.requests).toHaveLength(1)
  })

  it('pide el puzzle con la dificultad y el modo del estado', () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.selectDifficulty('experto')
      result.current.setIrregular(false)
    })
    act(() => {
      result.current.generate()
    })
    expect(runner.requests[0]).toEqual({
      difficultyId: 'experto',
      seed: undefined,
      irregular: false,
    })
  })

  it('las opciones explícitas ganan a las del estado', () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.generate({ difficulty: 'media', seed: 42, irregular: true })
    })
    expect(runner.requests[0]).toEqual({ difficultyId: 'media', seed: 42, irregular: true })
  })

  it('pasa a jugar con el puzzle recibido', async () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.generate()
    })
    const puzzle = makePuzzle()
    await resolveNext(puzzle)

    expect(result.current.state.status).toBe(STATUS.PLAYING)
    expect(result.current.state.puzzle).toBe(puzzle)
  })

  it('un fallo del generador llega a la pantalla con su mensaje', async () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.generate()
    })
    await rejectNext(new Error('No se pudo generar un puzzle válido'))

    expect(result.current.state.status).toBe(STATUS.ERROR)
    expect(result.current.state.error).toBe('No se pudo generar un puzzle válido')
  })
})

describe('loadFromCode', () => {
  const codeFor = (over = {}) =>
    encodeShareCode({ difficultyId: 'facil', seed: 7, irregular: false, ...over })

  it('decodifica en el hilo principal: un código inválido no llega al worker', async () => {
    const { result } = renderHook(() => useGame())
    await act(async () => {
      await result.current.loadFromCode('ESTO-NO-ES')
    })

    expect(runner.requests).toHaveLength(0)
    expect(result.current.state.status).toBe(STATUS.ERROR)
    expect(result.current.state.error).toBeTruthy()
  })

  it('pide el puzzle con lo que trae el código', () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.loadFromCode(codeFor({ difficultyId: 'media', seed: 1234, irregular: true }))
    })
    expect(runner.requests[0]).toEqual({
      difficultyId: 'media',
      seed: 1234,
      irregular: true,
    })
  })

  it('precoloca las fichas del código, validadas contra el mapa regenerado', async () => {
    const { result } = renderHook(() => useGame())
    // Orden canónico: sospechosos alfabéticos + víctima. Alba a (0,1), Carla
    // sin colocar (63) y Sergio a (2,2).
    act(() => {
      result.current.loadFromCode(codeFor({ placementIndices: [1, 63, 2 * GRID + 2, 63] }))
    })
    await resolveNext(makePuzzle())

    expect(result.current.state.status).toBe(STATUS.PLAYING)
    expect(result.current.state.placements).toEqual({
      Alba: { row: 0, col: 1 },
      Sergio: { row: 2, col: 2 },
    })
  })

  it('descarta las fichas que el mapa regenerado ya no admite', async () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.loadFromCode(codeFor({ placementIndices: [1, 63, 63, 63] }))
    })
    // La celda (0,1) pasó a estar ocupada por mobiliario: la ficha se cae, pero
    // la partida arranca igual en vez de romperse.
    const map = makePuzzle().map
    map.grid[0][1] = 'mesa'
    await resolveNext(makePuzzle({ map }))

    expect(result.current.state.status).toBe(STATUS.PLAYING)
    expect(result.current.state.placements).toEqual({})
  })
})

describe('resumeGame', () => {
  const saved = {
    status: STATUS.PLAYING,
    difficulty: 'facil',
    irregular: false,
    seed: 7,
    placements: { Alba: { row: 1, col: 1 } },
    marks: { '2,2': ['Carla'] },
    struckClues: ['Alba'],
    revealedExtraIds: [],
  }

  it('recupera el progreso guardado, no solo el tablero', async () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.resumeGame(saved)
    })
    expect(runner.requests[0]).toEqual({ difficultyId: 'facil', seed: 7, irregular: false })

    await resolveNext(makePuzzle())

    expect(result.current.state.status).toBe(STATUS.PLAYING)
    expect(result.current.state.placements).toEqual(saved.placements)
    expect(result.current.state.marks).toEqual(saved.marks)
    expect(result.current.state.struckClues).toEqual(saved.struckClues)
  })

  it('conserva el estado FAIL de la partida guardada', async () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.resumeGame({ ...saved, status: STATUS.FAIL })
    })
    await resolveNext(makePuzzle())
    expect(result.current.state.status).toBe(STATUS.FAIL)
  })

  it('borra el guardado que ya no reconstruye, para no volver a ofrecerlo', async () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.resumeGame(saved)
    })
    await rejectNext(new Error('Dificultad desconocida: inventada'))

    expect(clearSavedGame).toHaveBeenCalledTimes(1)
    expect(result.current.state.status).toBe(STATUS.ERROR)
  })
})

describe('peticiones solapadas', () => {
  it('la última manda y la reemplazada no toca el estado', async () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.generate({ difficulty: 'facil' })
    })
    act(() => {
      result.current.loadFromCode(encodeShareCode({ difficultyId: 'experto', seed: 99 }))
    })

    // El cliente rechaza la primera al ser reemplazada. Sin el `instanceof` que
    // la absorbe, esto pintaría un "Error:" sobre una carga que va bien.
    await rejectNext(new PuzzleRequestSuperseded())
    expect(result.current.state.status).toBe(STATUS.GENERATING)
    expect(result.current.state.error).toBeNull()

    await resolveNext(makePuzzle({ difficulty: 'experto' }))
    expect(result.current.state.status).toBe(STATUS.PLAYING)
    expect(result.current.state.puzzle.difficulty).toBe('experto')
  })
})

describe('desmontaje', () => {
  it('libera el worker ocioso', async () => {
    const { result, unmount } = renderHook(() => useGame())
    act(() => {
      result.current.generate()
    })
    await resolveNext(makePuzzle())

    unmount()
    expect(runner.disposeCount).toBe(1)
  })

  it('no mata una generación en vuelo', () => {
    // El desmontaje simulado de StrictMode no debe cortar un trabajo que el
    // remontaje inmediato sigue esperando.
    const { result, unmount } = renderHook(() => useGame())
    act(() => {
      result.current.generate()
    })

    unmount()
    expect(runner.disposeCount).toBe(0)
  })
})
