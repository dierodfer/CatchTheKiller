// Aviso al arrancar la app cuando hay una partida guardada localmente
// (recarga de página a mitad de un caso): permite continuar donde se dejó o
// descartarla y empezar de cero.

import { RotateCcw, Sparkles } from 'lucide-react'
import ConfirmModal from './ConfirmModal.jsx'

export default function ResumeGameModal({ open, onDiscard, onResume }) {
  return (
    <ConfirmModal
      open={open}
      iconBg="bg-sage/15"
      icon={<RotateCcw size={28} className="text-sage-deep" />}
      title="¿Continuar partida?"
      description="Tienes un caso sin terminar."
      cancelLabel="Nueva partida"
      cancelIcon={<Sparkles size={16} />}
      onCancel={onDiscard}
      confirmLabel="Continuar"
      confirmIcon={<RotateCcw size={16} />}
      onConfirm={onResume}
    />
  )
}
