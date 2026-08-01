// Aviso al arrancar la app cuando hay una partida guardada localmente
// (recarga de página a mitad de un caso): permite continuar donde se dejó o
// descartarla y empezar de cero.

import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Sparkles } from 'lucide-react'

export default function ResumeGameModal({ open, onDiscard, onResume }) {
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
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-gold/20 bg-cream-100 p-7 text-center shadow-2xl ring-botanica"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sage/15">
              <RotateCcw size={28} className="text-sage-deep" />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-plum-900">¿Continuar partida?</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-plum-800">
              Tienes un caso sin terminar.
            </p>

            <div className="mt-6 flex justify-center gap-2">
              <button
                type="button"
                onClick={onDiscard}
                className="flex items-center gap-2 rounded-full border border-gold/20 bg-cream-200/70 px-5 py-2.5 text-sm font-medium text-plum-900 hover:bg-cream-300/70"
              >
                <Sparkles size={16} /> Nueva partida
              </button>
              <button
                type="button"
                onClick={onResume}
                className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-plum-950 transition hover:bg-gold-soft"
              >
                <RotateCcw size={16} /> Continuar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
