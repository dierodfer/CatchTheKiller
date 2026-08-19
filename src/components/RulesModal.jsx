import { Target, LayoutGrid, CheckCircle2 } from 'lucide-react'
import ModalShell from './ModalShell.jsx'

export default function RulesModal({ open, onClose }) {
  return (
    <ModalShell open={open} onClose={onClose} ariaLabel="Reglas del juego" closeOnEscape showCloseButton>
      <h2 className="mb-5 font-serif text-2xl font-semibold text-plum-900">Cómo jugar</h2>

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
    </ModalShell>
  )
}
