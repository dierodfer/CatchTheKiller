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
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-gold/20 bg-plum-850 p-7 text-center shadow-2xl ring-botanica"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose/15">
              <AlertTriangle size={28} className="text-rose" />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-cream">¿Ver la solución?</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-cream-soft">
              Se revelará el asesino y la posición de todos los personajes. La partida terminará y
              no podrás seguir intentando resolver este caso.
            </p>

            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={onCancel}
                className="flex items-center gap-2 rounded-full border border-gold/20 bg-plum-700/60 px-5 py-2.5 text-sm font-medium text-cream hover:bg-plum-600/70"
              >
                <X size={16} /> Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-plum-950 transition hover:bg-gold-soft"
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
