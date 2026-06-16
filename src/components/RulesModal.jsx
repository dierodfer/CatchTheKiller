import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, LayoutGrid, CheckCircle2 } from 'lucide-react'

export default function RulesModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            role="dialog"
            aria-modal="true"
            aria-label="Reglas del juego"
            className="relative w-full max-w-md rounded-3xl border border-gold/20 bg-cream-100 p-7 shadow-2xl ring-botanica"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 bg-cream-200/70 text-plum-700 hover:bg-cream-300/70"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>

            <h2 className="mb-5 font-serif text-2xl font-semibold text-plum-900">
              Cómo jugar
            </h2>

            <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-plum-800">
              <section className="flex gap-3">
                <Target size={20} className="mt-0.5 shrink-0 text-gold-deep" />
                <div>
                  <p className="mb-1 font-semibold text-plum-900">Objetivo del caso</p>
                  <p>
                    Coloca a todos los personajes en el mapa usando las pistas. El asesino es el
                    único sospechoso que estaba <span className="font-medium">a solas</span> con la
                    víctima en la misma habitación.
                  </p>
                </div>
              </section>

              <section className="flex gap-3">
                <LayoutGrid size={20} className="mt-0.5 shrink-0 text-gold-deep" />
                <div>
                  <p className="mb-1 font-semibold text-plum-900">Regla de colocación</p>
                  <p>
                    Ningún personaje puede compartir fila ni columna con otro. Las marcas{' '}
                    <span className="font-mono font-bold">×</span> en el tablero señalan las filas
                    y columnas ya ocupadas.
                  </p>
                </div>
              </section>

              <section className="flex gap-3">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-gold-deep" />
                <div>
                  <p className="mb-1 font-semibold text-plum-900">Cómo ganar</p>
                  <p>
                    Cuando hayas colocado a todos, pulsa{' '}
                    <span className="font-semibold">Resolver</span>. Si las posiciones cumplen
                    todas las pistas y el asesino queda claro, ¡caso resuelto!
                  </p>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
