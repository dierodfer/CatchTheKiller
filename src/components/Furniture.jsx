// Iconografía de mobiliario: sprites pixel art 8×8 (ver pixelArt.jsx).

import { PixelGrid } from './pixelArt.jsx'
import { FURNITURE_SPRITES } from './pixelSprites.js'

export function FurnitureIcon({ type, size = 20, className = '' }) {
  const sprite = FURNITURE_SPRITES[type]
  if (!sprite) return null
  return <PixelGrid grid={sprite.grid} palette={sprite.palette} size={size} className={className} />
}
