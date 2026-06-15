// Patrón de alfombra compartido entre Cell y MapPreview: trama de píxeles a
// cuadros (bordes nítidos, sin difuminado) más una capa de dither para
// sugerir una alfombra tejida en estilo pixel art.

export const RUG_PATTERN =
  'repeating-linear-gradient(0deg, rgba(160,125,60,0.45) 0 4px, rgba(116,82,122,0.4) 4px 8px),' +
  ' repeating-linear-gradient(90deg, rgba(203,163,92,0.32) 0 4px, transparent 4px 8px)'

export const RUG_NOISE =
  'repeating-conic-gradient(rgba(255,255,255,0.55) 0% 25%, transparent 0% 50%)'

export const RUG_NOISE_SIZE = '6px 6px'
