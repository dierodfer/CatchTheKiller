// La marca de línea de control: el aspa que aparece en cada celda de la fila y
// la columna que domina una ficha ya colocada.
//
// Es una SEÑAL DE JUEGO, no decorado, y de ahí salen sus dos reglas:
//
//   · No se tematiza. Igual que el resaltado de revelado o el contorno de
//     soltado (ver boardCell.js), significa lo mismo en las tres zonas, así
//     que cambiar de aspa según la ambientación debilitaría la lectura sin
//     aportar nada a cambio.
//   · Pesa poco a propósito. Marca dónde NO puede ir una ficha; si compitiera
//     con las fichas o con las anotaciones, el tablero se leería como si cada
//     cosa en él fuera igual de urgente.
//
// La geometría de cada variante está en controlMarks.js; aquí solo se traduce
// a SVG. El color entra por `currentColor`, así el llamante lo fija en un solo
// sitio y un futuro estado —resaltar la línea de la ficha que se arrastra, por
// ejemplo— sería cambiar el color, no el dibujo.

import { CONTROL_MARK, CONTROL_MARK_INK, CONTROL_MARK_VARIANTS } from './controlMarks.js'

export function ControlMark({ variant = CONTROL_MARK, size, className, style }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={{ color: CONTROL_MARK_INK, ...style }}
      aria-hidden="true"
    >
      {CONTROL_MARK_VARIANTS[variant].map((layer) => (
        <g
          key={layer.id}
          opacity={layer.opacity}
          // Sin `width` la capa va rellena: es como se define el aspa de canto
          // vivo, que es un contorno cerrado y no una sucesión de trazos.
          fill={layer.width ? 'none' : 'currentColor'}
          stroke={layer.width ? 'currentColor' : 'none'}
          strokeWidth={layer.width}
          strokeLinecap="round"
        >
          {layer.paths.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      ))}
    </svg>
  )
}
