// Máquina de estados de la aplicación (sección 13 del documento), con useReducer.

import { useCallback, useReducer } from 'react'
import { generatePuzzle } from '../game/puzzleGenerator.js'
import { validatePlayerSolution } from '../game/solver.js'

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
  puzzle: null,
  placements: {}, // { nombre: { row, col } } colocados por el jugador
  usedClues: {}, // { clueIndex: true } marcadas como usadas
  result: null,
  hint: null,
  hintsUsed: 0,
  error: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_DIFFICULTY':
      return { ...state, difficulty: action.difficulty }

    case 'GENERATE_START':
      return { ...state, status: STATUS.GENERATING, error: null }

    case 'GENERATE_SUCCESS':
      return {
        ...initialState,
        difficulty: state.difficulty,
        status: STATUS.PLAYING,
        puzzle: action.puzzle,
      }

    case 'GENERATE_ERROR':
      return { ...state, status: STATUS.ERROR, error: action.error }

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

    case 'TOGGLE_CLUE': {
      const usedClues = { ...state.usedClues }
      usedClues[action.index] = !usedClues[action.index]
      return { ...state, usedClues }
    }

    case 'HINT':
      return { ...state, hint: action.hint, hintsUsed: state.hintsUsed + 1 }

    case 'DISMISS_HINT':
      return { ...state, hint: null }

    case 'CHECK':
      return {
        ...state,
        status: action.result.solved ? STATUS.WIN : STATUS.FAIL,
        result: action.result,
      }

    case 'BACK_TO_PLAY':
      return { ...state, status: STATUS.PLAYING, result: null }

    case 'NEW_GAME':
      return { ...initialState, difficulty: state.difficulty }

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

  const generate = useCallback(
    (difficulty) => {
      const diff = difficulty || state.difficulty
      dispatch({ type: 'GENERATE_START' })
      // Diferido para que el spinner se pinte antes del trabajo síncrono.
      setTimeout(() => {
        try {
          const puzzle = generatePuzzle(diff)
          dispatch({ type: 'GENERATE_SUCCESS', puzzle })
        } catch (e) {
          dispatch({ type: 'GENERATE_ERROR', error: e.message })
        }
      }, 30)
    },
    [state.difficulty],
  )

  const place = useCallback((name, row, col) => dispatch({ type: 'PLACE', name, row, col }), [])
  const unplace = useCallback((name) => dispatch({ type: 'UNPLACE', name }), [])
  const toggleClue = useCallback((index) => dispatch({ type: 'TOGGLE_CLUE', index }), [])

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

  // Ayuda progresiva: el Solver revela la posición correcta de un personaje
  // aún mal colocado o sin colocar (penaliza la puntuación).
  const requestHint = useCallback(() => {
    const { puzzle, placements } = state
    const all = [...puzzle.characters.suspects, puzzle.characters.victim]
    const target = all.find((name) => {
      const p = placements[name]
      const s = puzzle.solution[name]
      return !p || p.row !== s.row || p.col !== s.col
    })
    if (!target) return
    const s = puzzle.solution[target]
    dispatch({
      type: 'HINT',
      hint: {
        name: target,
        row: s.row,
        col: s.col,
        text: `${target} estaba en la fila ${s.row + 1}, columna ${s.col + 1}.`,
      },
    })
  }, [state])

  const dismissHint = useCallback(() => dispatch({ type: 'DISMISS_HINT' }), [])
  const backToPlay = useCallback(() => dispatch({ type: 'BACK_TO_PLAY' }), [])
  const newGame = useCallback(() => dispatch({ type: 'NEW_GAME' }), [])

  return {
    state,
    selectDifficulty,
    generate,
    place,
    unplace,
    toggleClue,
    check,
    requestHint,
    dismissHint,
    backToPlay,
    newGame,
  }
}
