// Iconografía de mobiliario con lucide-react (ligera y tree-shakeable).

import { Table, Tv, Flower2, Armchair, AppWindow } from 'lucide-react'

const ICONS = {
  mesa: Table,
  TV: Tv,
  planta: Flower2,
  silla: Armchair,
}

export function FurnitureIcon({ type, size = 20, className = '' }) {
  if (type === 'alfombra') {
    // No hay icono de alfombra: se representa con una placa redondeada.
    return (
      <div
        className={`rounded-md ${className}`}
        style={{
          width: size + 6,
          height: size,
          background:
            'repeating-linear-gradient(45deg, rgba(217,119,6,0.55) 0 4px, rgba(120,53,15,0.55) 4px 8px)',
        }}
      />
    )
  }
  const Icon = ICONS[type]
  if (!Icon) return null
  return <Icon size={size} className={className} />
}

export function WindowIcon({ size = 20, className = '' }) {
  return <AppWindow size={size} className={className} />
}
