// Aviso de confirmación antes de revelar la solución (sección 9): una vez
// revelada, la partida termina y no se puede seguir intentando.

import { AlertTriangle, Eye, X } from 'lucide-react'
import ConfirmModal from './ConfirmModal.jsx'

export default function RevealConfirmModal({ open, onCancel, onConfirm }) {
  return (
    <ConfirmModal
      open={open}
      role="alertdialog"
      iconBg="bg-rose/15"
      icon={<AlertTriangle size={28} className="text-rose-deep" />}
      title="¿Ver la solución?"
      description="Se revelará el asesino y la posición de todos los personajes. La partida terminará y no podrás seguir intentando resolver este caso."
      cancelLabel="Cancelar"
      cancelIcon={<X size={16} />}
      onCancel={onCancel}
      confirmLabel="Ver solución"
      confirmIcon={<Eye size={16} />}
      onConfirm={onConfirm}
    />
  )
}
