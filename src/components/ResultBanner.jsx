// Resultado de la partida (sección 9): WIN revela asesino y víctima; FAIL solo
// indica que hay errores, sin revelar la solución.

import { motion, AnimatePresence } from 'framer-motion'
import { Skull, AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react'

export default function ResultBanner({ status, result, characters, onBackToPlay, onNewGame }) {
  const win = status === 'win'
  const fail = status === 'fail'
  if (!win && !fail) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.85, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className={`w-full max-w-md rounded-2xl p-6 text-center shadow-2xl ring-1 ${
            win ? 'bg-ink-800 ring-blood/40' : 'bg-ink-800 ring-amber-400/30'
          }`}
        >
          {win ? (
            <>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blood/20">
                <Skull size={30} className="text-blood" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {result.revealed ? 'Solución revelada' : '¡Caso resuelto!'}
              </h2>
              <p className="mt-2 text-slate-300">
                El asesino es{' '}
                <span className="font-bold text-blood">{result.killer}</span>. Controlaba la fila y
                la columna de la víctima,{' '}
                <span className="font-semibold text-slate-200">{characters.victim}</span>.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/15">
                <AlertTriangle size={30} className="text-amber-300" />
              </div>
              <h2 className="text-2xl font-bold text-white">Reconstrucción incorrecta</h2>
              <p className="mt-2 text-slate-300">
                Hay posiciones que no encajan con las pistas. Revisa el tablero: la solución no se
                revela.
              </p>
            </>
          )}

          <div className="mt-5 flex justify-center gap-2">
            {fail && (
              <button
                onClick={onBackToPlay}
                className="flex items-center gap-2 rounded-lg bg-ink-600 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-ink-500"
              >
                <ArrowLeft size={16} /> Seguir intentando
              </button>
            )}
            <button
              onClick={onNewGame}
              className="flex items-center gap-2 rounded-lg bg-blood px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              <RotateCcw size={16} /> Nuevo puzzle
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
