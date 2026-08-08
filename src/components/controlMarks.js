// Aspas de línea de control: la geometría, sin React (el componente que las
// dibuja es ControlMark.jsx — mismo reparto que pixelSprites.js / pixelArt.jsx).
//
// Cada variante es una lista de CAPAS que se pintan en orden, y cada capa es
// un puñado de paths en un `viewBox` de 24×24:
//
//   id      — qué es esa capa; sirve además de key estable al renderizar.
//   paths   — los trazos de la capa.
//   width   — grosor del trazo; si falta, la capa va rellena en vez de trazada.
//   opacity — opacidad de la capa (1 si falta).
//
// Coordenadas en un lienzo de 24, no en píxeles: el aspa se escala con la
// celda, así que el trazo sale igual de limpio a 95 px que a los 36 px del
// móvil. Es justo lo que no conseguía la rejilla de 8×8 píxeles anterior, que
// a tamaño pequeño se deshacía en cuatro puntos sueltos.

export const CONTROL_MARK_VARIANTS = {
  // Aspa de trazo fino y extremos redondeados. La más neutra: no imita
  // ninguna herramienta, solo tacha.
  fina: [{ id: 'trazo', paths: ['M6.5 6.5 L17.5 17.5', 'M17.5 6.5 L6.5 17.5'], width: 2 }],

  // A mano alzada: los dos trazos van ligeramente arqueados y no se cruzan
  // exactamente en el centro, y encima llevan una segunda pasada más fina y
  // desplazada. Es el gesto de tachar una casilla a lápiz sobre la hoja del
  // caso — el mismo registro que las anotaciones del jugador.
  lapiz: [
    {
      id: 'pasada',
      paths: ['M6.1 6.4 Q12.2 11.6 18.1 17.8', 'M17.9 6.2 Q12.1 12.3 6.3 17.9'],
      width: 2.1,
    },
    {
      id: 'repaso',
      paths: ['M6.9 5.9 Q12.6 11.3 18.6 17.2', 'M18.4 6.9 Q12.7 12.9 6.8 18.5'],
      width: 1.2,
      opacity: 0.45,
    },
  ],

  // Canto vivo: un contorno relleno, no un trazo. Los cuatro brazos tienen los
  // bordes rectos y las puntas en escuadra, así que se lee como una pieza
  // dibujada y no como algo escrito encima.
  canto: [
    {
      id: 'contorno',
      paths: [
        'M7.1 5.7 L5.7 7.1 L10.6 12 L5.7 16.9 L7.1 18.3 L12 13.4 ' +
          'L16.9 18.3 L18.3 16.9 L13.4 12 L18.3 7.1 L16.9 5.7 L12 10.6 Z',
      ],
    },
  ],

  // Recortada: solo las cuatro puntas, el centro vacío. La más discreta —
  // deja libre el medio de la celda, que es donde caen la ficha y el
  // mobiliario, así que no se solapa nunca con ellos.
  recortada: [
    {
      id: 'puntas',
      paths: ['M6 6 L9.4 9.4', 'M18 6 L14.6 9.4', 'M6 18 L9.4 14.6', 'M18 18 L14.6 14.6'],
      width: 2.2,
    },
  ],
}

// Variante en uso. Cambiar este nombre cambia el aspa en todo el tablero.
export const CONTROL_MARK = 'lapiz'

// Tinta del aspa. Más opaca que la marca de píxeles que sustituye (0.10):
// aquel valor compensaba que los píxeles cubrían mucha superficie de la celda,
// y estos trazos son mucho más finos — con 0.10 se perdían.
export const CONTROL_MARK_INK = 'rgba(43,26,47,0.30)'
