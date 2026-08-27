// Base compartida de los diálogos de contenido libre (fondo, tarjeta animada
// y, opcionalmente, cierre con Escape y botón de cerrar en la esquina): usada
// por RulesModal, ShareModal y LegendModal para no duplicar la estructura del
// diálogo. Es la contraparte de ConfirmModal para el otro patrón de modal que
// tiene esta app — aquí el contenido es libre (texto largo, formularios,
// listas con scroll propio) en vez del icono+título+dos botones fijo de los
// diálogos de confirmación, así que en lugar de una plantilla de textos este
// componente solo envuelve `children`.

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function ModalShell({
  open,
  onClose,
  ariaLabel,
  labelledBy,
  panelClassName = 'w-full max-w-md p-7',
  closeOnEscape = false,
  showCloseButton = false,
  children,
}) {
  useEffect(() => {
    if (!open || !closeOnEscape) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeOnEscape, onClose])

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
            aria-label={ariaLabel}
            aria-labelledby={labelledBy}
            className={`relative rounded-3xl border border-gold/20 bg-cream-100 shadow-2xl ring-botanica ${panelClassName}`}
            onClick={(e) => e.stopPropagation()}
          >
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 bg-cream-200/70 text-plum-700 hover:bg-cream-300/70"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
