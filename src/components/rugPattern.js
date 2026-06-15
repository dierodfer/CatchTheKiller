// Patrón de alfombra compartido entre Cell y MapPreview: bandas diagonales de
// ancho irregular (más orgánico que un rayado uniforme) más una capa de ruido
// SVG para sugerir textura de fibra tejida.

export const RUG_PATTERN =
  'repeating-linear-gradient(45deg,' +
  ' rgba(203,163,92,0.45) 0 5px, rgba(116,82,122,0.4) 5px 8px,' +
  ' rgba(160,125,60,0.42) 8px 15px, rgba(125,145,98,0.35) 15px 19px)'

export const RUG_NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='r'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23r)' opacity='0.5'/%3E%3C/svg%3E\")"
