// Aviso de confirmación antes de revelar la solución (sección 9): una vez
// revelada, la partida termina y no se puede seguir intentando.

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Eye, X } from 'lucide-react'

export default function RevealConfirmModal({ open, onCancel, onConfirm }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="w-full max-w-md rounded-2xl bg-ink-800 p-6 text-center shadow-2xl ring-1 ring-amber-400/30"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/15">
              <AlertTriangle size={30} className="text-amber-300" />
            </div>
            <h2 className="text-2xl font-bold text-white">¿Ver la solución?</h2>
            <p className="mt-2 text-slate-300">
              Se revelará el asesino y la posición de todos los personajes. La partida terminará y
              no podrás seguir intentando resolver este caso.
            </p>

            <div className="mt-5 flex justify-center gap-2">
              <button
                onClick={onCancel}
                className="flex items-center gap-2 rounded-lg bg-ink-600 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-ink-500"
              >
                <X size={16} /> Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-ink-900 hover:brightness-110"
              >
                <Eye size={16} /> Ver solución
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
