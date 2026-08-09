// Máquina de estados de la aplicación (sección 13 del documento), con useReducer.

import { useCallback, useEffect, useReducer } from 'react'
import { generatePuzzle } from '@/game/puzzleGenerator.js'
import { decodeShareCode, indicesToPlacements } from '@/game/shareCode.js'
import {
  filterValidMarks,
  filterValidPlacements,
  filterValidRevealedExtras,
  filterValidStruckClues,
} from '@/game/placements.js'
import { cellKey } from '@/game/constants.js'
import { clueId } from '@/game/clues.js'
import { pickNextHint } from '@/game/hints.js'
import { validatePlayerSolution } from '@/game/solver.js'
import { saveGame, clearSavedGame } from './gameStorage.js'

export const STATUS = {
  IDLE: 'idle',
  GENERATING: 'generating',
  PLAYING: 'playing',
  WIN: 'win',
  FAIL: 'fail',
  ERROR: 'error',
}

const initialState = {
  status: STATUS.IDLE,
  difficulty: 'facil',
  irregular: true, // toggle "mapa irregular" de la pantalla de inicio (activo por defecto)
  puzzle: null,
  placements: {}, // { nombre: { row, col } } colocados por el jugador
  marks: {}, // { 'fila,col': [nombre] } anotaciones de candidatos del jugador
  struckClues: [], // sujetos cuyo testimonio ha descartado el jugador
  revealedExtraIds: [], // ids de las pistas extra ya concedidas al jugador
  result: null,
  error: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_DIFFICULTY':
      return { ...state, difficulty: action.difficulty }

    case 'SET_IRREGULAR':
      return { ...state, irregular: action.irregular }

    case 'GENERATE_START':
      return { ...state, status: STATUS.GENERATING, error: null }

    case 'GENERATE_SUCCESS':
      return {
        ...initialState,
        difficulty: action.puzzle.difficulty,
        irregular: action.puzzle.irregular ?? state.irregular,
        status: STATUS.PLAYING,
        puzzle: action.puzzle,
        // Fichas iniciales (partida compartida "con estado"): ya validadas.
        placements: action.initialPlacements || {},
      }

    case 'GENERATE_ERROR':
      return { ...state, status: STATUS.ERROR, error: action.error }

    // Reanuda una partida guardada localmente: a diferencia de GENERATE_SUCCESS,
    // conserva el estado (playing/fail) y las pistas extra ya reveladas.
    case 'RESTORE_GAME':
      return {
        ...initialState,
        difficulty: action.puzzle.difficulty,
        irregular: action.puzzle.irregular ?? state.irregular,
        status: action.status,
        puzzle: action.puzzle,
        placements: action.placements,
        marks: action.marks,
        struckClues: action.struckClues,
        revealedExtraIds: action.revealedExtraIds,
      }

    case 'PLACE': {
      const { name, row, col } = action
      // Liberar la celda si otro personaje la ocupaba.
      const placements = { ...state.placements }
      for (const k of Object.keys(placements)) {
        if (placements[k].row === row && placements[k].col === col) delete placements[k]
      }
      placements[name] = { row, col }
      return { ...state, placements, result: null }
    }

    case 'UNPLACE': {
      const placements = { ...state.placements }
      delete placements[action.name]
      return { ...state, placements, result: null }
    }

    // Anotación de candidato en una casilla: alterna el personaje y descarta
    // la entrada cuando se queda sin nombres.
    case 'TOGGLE_MARK': {
      const key = cellKey(action.row, action.col)
      const current = state.marks[key] || []
      const next = current.includes(action.name)
        ? current.filter((n) => n !== action.name)
        : [...current, action.name]
      const marks = { ...state.marks }
      if (next.length === 0) delete marks[key]
      else marks[key] = next
      return { ...state, marks }
    }

    // Descarta (o recupera) el testimonio de un sujeto en el tablero de
    // evidencias. Es solo una anotación: no altera la lógica del caso.
    case 'TOGGLE_STRUCK_CLUE': {
      const { subject } = action
      const struckClues = state.struckClues.includes(subject)
        ? state.struckClues.filter((s) => s !== subject)
        : [...state.struckClues, subject]
      return { ...state, struckClues }
    }

    case 'CHECK':
      return {
        ...state,
        status: action.result.solved ? STATUS.WIN : STATUS.FAIL,
        result: action.result,
      }

    case 'REVEAL': {
      const { puzzle } = state
      const v = puzzle.solution[puzzle.characters.victim]
      return {
        ...state,
        placements: { ...puzzle.solution },
        status: STATUS.WIN,
        result: {
          solved: true,
          complete: true,
          killer: puzzle.killer,
          room: puzzle.roomLookup[cellKey(v.row, v.col)],
          errorCount: 0,
          revealed: true,
        },
      }
    }

    // Concede una pista adicional. Cuál se concede no es aleatorio: depende del
    // tablero en este momento — primero los personajes sin colocar, después los
    // mal colocados (ver `hints.js`).
    case 'REQUEST_EXTRA_CLUE': {
      const { puzzle, revealedExtraIds } = state
      if (!puzzle) return state
      if (revealedExtraIds.length >= (puzzle.extraClueBudget || 0)) return state
      const hint = pickNextHint({
        extraClues: puzzle.extraClues,
        revealedIds: revealedExtraIds,
        placements: state.placements,
        solution: puzzle.solution,
      })
      if (!hint) return state
      return { ...state, revealedExtraIds: [...revealedExtraIds, clueId(hint)] }
    }

    case 'BACK_TO_PLAY':
      return { ...state, status: STATUS.PLAYING, result: null }

    case 'NEW_GAME':
      return { ...initialState, difficulty: state.difficulty, irregular: state.irregular }

    default:
      return state
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const selectDifficulty = useCallback(
    (difficulty) => dispatch({ type: 'SELECT_DIFFICULTY', difficulty }),
    [],
  )

  const setIrregular = useCallback(
    (irregular) => dispatch({ type: 'SET_IRREGULAR', irregular }),
    [],
  )

  // Genera una partida. Sin opciones usa la dificultad y el toggle del estado;
  // con `seed` (partida compartida) reproduce el puzzle exacto, y
  // `initialPlacements` precoloca fichas ({ nombre: { row, col } }, validadas).
  const generate = useCallback(
    ({ difficulty, seed, irregular, initialPlacements } = {}) => {
      const diff = difficulty || state.difficulty
      const irr = irregular ?? state.irregular
      dispatch({ type: 'GENERATE_START' })
      // Diferido para que el spinner se pinte antes del trabajo síncrono.
      setTimeout(() => {
        try {
          const puzzle = generatePuzzle(diff, seed ?? undefined, { irregular: irr })
          dispatch({ type: 'GENERATE_SUCCESS', puzzle, initialPlacements })
        } catch (e) {
          dispatch({ type: 'GENERATE_ERROR', error: e.message })
        }
      }, 30)
    },
    [state.difficulty, state.irregular],
  )

  // Carga una partida desde un código compartido. Un código malformado pasa el
  // estado a ERROR con mensaje amable (se muestra en la pantalla de inicio).
  // Las fichas recibidas se validan contra el mapa regenerado: fuera de rango,
  // no ocupables o duplicadas se descartan sin romper la partida.
  const loadFromCode = useCallback((codeString) => {
    dispatch({ type: 'GENERATE_START' })
    setTimeout(() => {
      try {
        const { difficultyId, seed, irregular, placementIndices } = decodeShareCode(codeString)
        const puzzle = generatePuzzle(difficultyId, seed, { irregular })
        let initialPlacements
        if (placementIndices) {
          const raw = indicesToPlacements(placementIndices, puzzle.characters, puzzle.map.gridSize)
          initialPlacements = filterValidPlacements(raw, puzzle)
        }
        dispatch({ type: 'GENERATE_SUCCESS', puzzle, initialPlacements })
      } catch (e) {
        dispatch({ type: 'GENERATE_ERROR', error: e.message })
      }
    }, 30)
  }, [])

  // Reanuda una partida guardada en localStorage (ver gameStorage.js). Regenera
  // el puzzle desde (difficulty, seed, irregular) y valida las fichas contra
  // el mapa recién generado, igual que loadFromCode, por si el guardado quedó
  // desactualizado o corrupto.
  const resumeGame = useCallback((saved) => {
    dispatch({ type: 'GENERATE_START' })
    setTimeout(() => {
      try {
        const puzzle = generatePuzzle(saved.difficulty, saved.seed, { irregular: saved.irregular })
        const placements = filterValidPlacements(saved.placements, puzzle)
        dispatch({
          type: 'RESTORE_GAME',
          puzzle,
          placements,
          marks: filterValidMarks(saved.marks, puzzle),
          struckClues: filterValidStruckClues(saved.struckClues, puzzle),
          revealedExtraIds: filterValidRevealedExtras(saved.revealedExtraIds, puzzle),
          status: saved.status === STATUS.FAIL ? STATUS.FAIL : STATUS.PLAYING,
        })
      } catch (e) {
        clearSavedGame()
        dispatch({ type: 'GENERATE_ERROR', error: e.message })
      }
    }, 30)
  }, [])

  // Guarda la partida en curso (playing/fail) tras cada cambio relevante, y la
  // borra al ganar. IDLE nunca dispara el borrado aquí (evitaría una carrera
  // con la lectura inicial en App.jsx, ya que IDLE es también el estado de
  // montaje): NEW_GAME borra explícitamente en su propio callback más abajo.
  useEffect(() => {
    if (state.status === STATUS.PLAYING || state.status === STATUS.FAIL) {
      saveGame({
        status: state.status,
        difficulty: state.puzzle.difficulty,
        irregular: state.puzzle.irregular,
        seed: state.puzzle.seed,
        placements: state.placements,
        marks: state.marks,
        struckClues: state.struckClues,
        revealedExtraIds: state.revealedExtraIds,
      })
    } else if (state.status === STATUS.WIN) {
      clearSavedGame()
    }
  }, [
    state.status,
    state.puzzle,
    state.placements,
    state.marks,
    state.struckClues,
    state.revealedExtraIds,
  ])

  const place = useCallback((name, row, col) => dispatch({ type: 'PLACE', name, row, col }), [])
  const unplace = useCallback((name) => dispatch({ type: 'UNPLACE', name }), [])
  const toggleMark = useCallback(
    (row, col, name) => dispatch({ type: 'TOGGLE_MARK', row, col, name }),
    [],
  )
  const toggleStruckClue = useCallback(
    (subject) => dispatch({ type: 'TOGGLE_STRUCK_CLUE', subject }),
    [],
  )

  const check = useCallback(() => {
    const { puzzle, placements } = state
    const result = validatePlayerSolution(
      puzzle.map,
      puzzle.characters,
      puzzle.clues,
      placements,
      puzzle.roomLookup,
    )
    dispatch({ type: 'CHECK', result })
  }, [state])

  const reveal = useCallback(() => dispatch({ type: 'REVEAL' }), [])
  const requestExtraClue = useCallback(() => dispatch({ type: 'REQUEST_EXTRA_CLUE' }), [])
  const backToPlay = useCallback(() => dispatch({ type: 'BACK_TO_PLAY' }), [])
  const newGame = useCallback(() => {
    clearSavedGame()
    dispatch({ type: 'NEW_GAME' })
  }, [])

  return {
    state,
    selectDifficulty,
    setIrregular,
    generate,
    loadFromCode,
    resumeGame,
    place,
    unplace,
    toggleMark,
    toggleStruckClue,
    check,
    reveal,
    requestExtraClue,
    backToPlay,
    newGame,
  }
}
