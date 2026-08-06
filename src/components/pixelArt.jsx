// Componentes "pixel art" reutilizados en el tablero (fichas, mobiliario,
// ventanas, marca de control) y en el panel de pistas (retratos).
//
// Cada sprite es una rejilla de índices de color (ver pixelSprites.js);
// `PixelGrid` la dibuja como un `<svg>` con `shapeRendering="crispEdges"`
// para mantener los bordes nítidos sin importar el tamaño final.

import {
  FACE_GRID,
  SKULL_GRID,
  SKULL_PALETTE,
  AVATAR_OUTLINE,
  LUPA_GRID,
  LUPA_SPENT_GRID,
  LUPA_PALETTE,
  LUPA_SPENT_PALETTE,
} from './pixelSprites.js'

export function PixelGrid({ grid, palette, size = 24, className, style }) {
  const rows = grid.length
  const cols = grid[0].length
  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {grid.flatMap((row, y) =>
        row.map((v, x) =>
          v ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={palette[v]} /> : null,
        ),
      )}
    </svg>
  )
}

// Retrato de personaje: un sospechoso se colorea con su tono asignado; la
// víctima es una calavera de hueso (ignora `color`, no está en la rotación).
export function PixelAvatar({ color, isVictim = false, size = 24, className, style }) {
  const grid = isVictim ? SKULL_GRID : FACE_GRID
  const palette = isVictim ? SKULL_PALETTE : { 1: AVATAR_OUTLINE, 2: color, 3: AVATAR_OUTLINE }
  return <PixelGrid grid={grid} palette={palette} size={size} className={className} style={style} />
}

// Lupa del panel de pistas: dorada mientras queda por gastar, gris y tachada
// una vez usada.
export function PixelLupa({ spent = false, size = 26, className, style }) {
  return (
    <PixelGrid
      grid={spent ? LUPA_SPENT_GRID : LUPA_GRID}
      palette={spent ? LUPA_SPENT_PALETTE : LUPA_PALETTE}
      size={size}
      className={className}
      style={style}
    />
  )
}
