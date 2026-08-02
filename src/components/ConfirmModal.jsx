// Base compartida de los diálogos de confirmación (fondo, tarjeta animada,
// icono, título y dos botones): usada por RevealConfirmModal y
// ResumeGameModal para no duplicar la estructura del diálogo.

import { motion, AnimatePresence } from 'framer-motion'

export default function ConfirmModal({
  open,
  role = 'dialog',
  iconBg,
  icon,
  title,
  description,
  cancelLabel,
  cancelIcon,
  onCancel,
  confirmLabel,
  confirmIcon,
  onConfirm,
}) {
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
            role={role}
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-gold/20 bg-cream-100 p-7 text-center shadow-2xl ring-botanica"
          >
            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${iconBg}`}
            >
              {icon}
            </div>
            <h2 className="font-serif text-3xl font-semibold text-plum-900">{title}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-plum-800">{description}</p>

            <div className="mt-6 flex justify-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-2 rounded-full border border-gold/20 bg-cream-200/70 px-5 py-2.5 text-sm font-medium text-plum-900 hover:bg-cream-300/70"
              >
                {cancelIcon} {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-plum-950 transition hover:bg-gold-soft"
              >
                {confirmIcon} {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
