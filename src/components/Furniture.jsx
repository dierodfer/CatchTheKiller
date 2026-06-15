// Iconografía de mobiliario y ventanas: sprites pixel art 8×8 (ver pixelArt.jsx).

import { PixelGrid } from './pixelArt.jsx'
import { FURNITURE_SPRITES, WINDOW_GRID, WINDOW_PALETTE } from './pixelSprites.js'

export function FurnitureIcon({ type, size = 20, className = '' }) {
  const sprite = FURNITURE_SPRITES[type]
  if (!sprite) return null
  return <PixelGrid grid={sprite.grid} palette={sprite.palette} size={size} className={className} />
}

export function WindowIcon({ size = 20, className = '' }) {
  return <PixelGrid grid={WINDOW_GRID} palette={WINDOW_PALETTE} size={size} className={className} />
}
