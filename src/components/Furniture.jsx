// Icono de un elemento del mapa, en el estilo de la zona.
//
// El emisor lo decide la ZONA (`zone.art`), no el elemento: dentro de una
// ambientación el mobiliario entero comparte lenguaje visual. Despachar por
// elemento invitaría a una zona que mezclase pixel art y sprites reales.

import { PixelGrid } from './pixelArt.jsx'

export function FurnitureIcon({ type, zone, size = 20, className }) {
  const art = zone.furniture[type]
  // Un tipo sin arte (la alfombra, que es una capa de fondo) no se dibuja aquí.
  if (!art) return null

  if (zone.art === 'pixel') {
    return <PixelGrid grid={art.grid} palette={art.palette} size={size} className={className} />
  }

  // 'sprite': un recorte real de 16×16 (Kenney, ver furnitureSprites.js), no
  // un icono vectorial de un solo color — `art` es directamente el data URI.
  // `imageRendering: 'pixelated'` evita que se difumine al escalar.
  return (
    <img
      src={art}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: 'pixelated' }}
      alt=""
      aria-hidden="true"
    />
  )
}
