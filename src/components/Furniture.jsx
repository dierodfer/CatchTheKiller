// Icono de un elemento del mapa, en el estilo de la zona.
//
// El emisor lo decide la ZONA (`zone.art`), no el elemento: dentro de una
// ambientación todo el mobiliario comparte lenguaje visual. Despachar por
// elemento invitaría a una zona que mezclase pixel art y vector.

import { PixelGrid } from './pixelArt.jsx'
import { FlatShape } from './flatArt.jsx'

export function FurnitureIcon({ type, zone, size = 20, className }) {
  const art = zone.furniture[type]
  // Un tipo sin arte (la alfombra, que es una capa de fondo) no se dibuja aquí.
  if (!art) return null
  return zone.art === 'pixel' ? (
    <PixelGrid grid={art.grid} palette={art.palette} size={size} className={className} />
  ) : (
    <FlatShape shape={art} size={size} className={className} />
  )
}
