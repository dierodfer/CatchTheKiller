// Resultado de la partida (sección 9): WIN revela asesino y víctima; FAIL solo
// indica que hay errores, sin revelar la solución.
//
// Al resolver el caso de verdad, el cierre es una celebración elaborada: la
// escena se ilumina (en el tablero) y aquí florecen pétalos dorados antes de
// presentar el desenlace en tipografía editorial.

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Sparkles, Eye, AlertTriangle, RotateCcw, ArrowLeft, X } from 'lucide-react'

// Pétalos que ascienden suavemente detrás del diálogo de victoria. Tonos
// "profundos" del sistema para que destaquen al caer sobre el tablero claro.
const PETALS = [
  { left: '12%', size: 16, color: 'rgba(160,125,60,0.85)', delay: 0.1, x: 14 },
  { left: '26%', size: 11, color: 'rgba(125,145,98,0.8)', delay: 0.5, x: -10 },
  { left: '44%', size: 20, color: 'rgba(203,163,92,0.9)', delay: 0.25, x: 8 },
  { left: '62%', size: 13, color: 'rgba(185,122,128,0.85)', delay: 0.65, x: -14 },
  { left: '78%', size: 17, color: 'rgba(160,125,60,0.8)', delay: 0.4, x: 12 },
  { left: '88%', size: 10, color: 'rgba(125,145,98,0.75)', delay: 0.8, x: -8 },
]

export default function ResultBanner({
  status,
  result,
  characters,
  onClose,
  onBackToPlay,
  onNewGame,
  bannerDelay = 0,
}) {
  const win = status === 'win'
  const fail = status === 'fail'
  const reduce = useReducedMotion()
  if (!win && !fail) return null

  const revealed = win && result.revealed
  const celebrate = win && !revealed && !reduce
  const delay = reduce ? 0 : bannerDelay

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-30 flex items-center justify-center overflow-hidden bg-plum-950/45 p-4 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay, duration: 0.5 }}
      >
        {/* Pétalos de celebración (solo al resolver de verdad). */}
        {celebrate &&
          PETALS.map((p, i) => (
            <motion.div
              key={i}
              className="pointer-events-none absolute bottom-0"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                borderRadius: '50% 0 50% 50%',
                background: p.color,
              }}
              initial={{ y: 40, opacity: 0, rotate: 0 }}
              animate={{ y: '-104vh', opacity: [0, 1, 1, 0], rotate: 220, x: p.x }}
              transition={{
                delay: delay + p.delay,
                duration: 4.2,
                ease: 'easeOut',
                repeat: Infinity,
                repeatDelay: 0.6,
              }}
            />
          ))}

        <motion.div
          initial={{ scale: 0.86, y: 22, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay, type: 'spring', stiffness: 240, damping: 22 }}
          role="dialog"
          aria-modal="true"
          className={`relative w-full max-w-md rounded-3xl border bg-cream-100 p-7 text-center shadow-2xl ${
            win ? 'border-gold/30' : 'border-rose/25'
          }`}
        >
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-plum-600 transition hover:bg-cream-200/70 hover:text-plum-900"
          >
            <X size={18} />
          </button>

          {win ? (
            <>
              <motion.div
                initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: delay + 0.1, type: 'spring', stiffness: 200, damping: 14 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 ring-1 ring-gold/40"
              >
                {revealed ? (
                  <Eye size={30} className="text-gold-deep" />
                ) : (
                  <Sparkles size={30} className="text-gold-deep" />
                )}
              </motion.div>
              <p className="eyebrow mb-1.5">{revealed ? 'El caso, al descubierto' : 'Caso cerrado'}</p>
              <h2 className="font-serif text-4xl font-semibold leading-none text-plum-900">
                {revealed ? 'Solución revelada' : '¡Caso resuelto!'}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-plum-800">
                El asesino es <span className="font-semibold text-gold-deep">{result.killer}</span>:
                era el único que estaba a solas con la víctima,{' '}
                <span className="font-semibold text-plum-900">{characters.victim}</span>
                {result.room ? (
                  <>
                    , en <span className="font-semibold text-plum-900">{result.room}</span>
                  </>
                ) : null}
                .
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose/15 ring-1 ring-rose/30">
                <AlertTriangle size={28} className="text-rose-deep" />
              </div>
              <p className="eyebrow mb-1.5" style={{ color: 'rgba(185,122,128,0.9)' }}>
                Aún no encaja
              </p>
              <h2 className="font-serif text-3xl font-semibold leading-tight text-plum-900">
                La reconstrucción no cuadra
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-plum-800">
                Hay posiciones que no encajan con las pistas. Revisa la escena: la solución no se
                revela.
              </p>
            </>
          )}

          <div className="mt-6 flex justify-center gap-2">
            {fail && (
              <button
                onClick={onBackToPlay}
                className="flex items-center gap-2 rounded-full border border-gold/20 bg-cream-200/70 px-5 py-2.5 text-sm font-medium text-plum-900 hover:bg-cream-300/70"
              >
                <ArrowLeft size={16} /> Seguir intentando
              </button>
            )}
            <button
              onClick={onNewGame}
              className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-plum-950 transition hover:bg-gold-soft"
            >
              <RotateCcw size={16} /> Nuevo caso
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
