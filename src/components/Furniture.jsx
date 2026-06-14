// Iconografía de mobiliario con lucide-react (ligera y tree-shakeable).

import { Table, Tv, Armchair, AppWindow } from 'lucide-react'

// lucide-react no incluye un icono de maceta: se dibuja a mano con el mismo
// estilo de trazo (24x24, stroke actual, esquinas redondeadas).
function MacetaIcon({ size = 20, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 11v6" />
      <path d="M12 11c-2.2-2.2-5.5-1.3-5.5 1.2 2.4 1.4 4.6.5 5.5-1.2z" />
      <path d="M12 11c2.2-2.2 5.5-1.3 5.5 1.2-2.4 1.4-4.6.5-5.5-1.2z" />
      <path d="M5 10h14l-1.4 9.3a1.5 1.5 0 0 1-1.5 1.2H7.9a1.5 1.5 0 0 1-1.5-1.2z" />
      <path d="M4 10h16" />
    </svg>
  )
}

const ICONS = {
  mesa: Table,
  TV: Tv,
  planta: MacetaIcon,
  silla: Armchair,
}

export function FurnitureIcon({ type, size = 20, className = '' }) {
  const Icon = ICONS[type]
  if (!Icon) return null
  return <Icon size={size} className={className} />
}

export function WindowIcon({ size = 20, className = '' }) {
  return <AppWindow size={size} className={className} />
}
