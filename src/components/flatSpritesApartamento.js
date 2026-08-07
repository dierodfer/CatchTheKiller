// Arte plano del APARTAMENTO EN LA CIUDAD: cristal, acero y negro mate, con
// las formas bajas y horizontales de un piso alto de rascacielos.
//
// Indexado por el `id` estable de `game/elements.js`. Esta zona no sustituye
// ningún nombre (ver `ZONE_ELEMENTS`): mesa, TV, planta, silla y cama describen
// igual de bien un piso moderno, así que aquí solo cambia el dibujo.
//
// Formato (ver flatArt.jsx): `viewBox` cuadrado, paleta de 2-3 tintas planas y
// una lista de primitivas — `rect: [x, y, w, h, rx?]`, `circle: [cx, cy, r]` o
// `path: 'M…'` — donde `c` es el índice de paleta.
//
// `alfombra` no está aquí a propósito: es una capa de fondo que abarca varias
// celdas (ver `rugLayerStyles`), no un icono centrado en una.

const NEGRO = '#22262e'
const ACERO = '#8a94a6'
const CRISTAL = '#cfe0ec'
const HUESO = '#eef1f5'
const VERDE = '#5f8f6a'
const VERDE_HONDO = '#3f6b4c'

export const FURNITURE_APARTAMENTO = {
  // Mesa de cristal: tablero fino sobre patas de acero negro. El canto oscuro
  // bajo el cristal es lo que lo hace visible contra el fondo claro del tablero.
  mesa: {
    viewBox: 24,
    palette: { 1: CRISTAL, 2: NEGRO },
    parts: [
      { rect: [1.5, 7.6, 21, 2.6, 0.6], c: 1 }, // tablero de cristal
      { rect: [1.5, 10.2, 21, 0.9], c: 2 }, // canto
      { rect: [4, 11.1, 1.4, 9.4], c: 2 }, // pata izquierda
      { rect: [18.6, 11.1, 1.4, 9.4], c: 2 }, // pata derecha
      { rect: [4, 18.6, 16, 1.2], c: 2 }, // travesaño bajo
    ],
  },

  // Televisor plano sobre pie central.
  TV: {
    viewBox: 24,
    palette: { 1: NEGRO, 2: ACERO, 3: CRISTAL },
    parts: [
      { rect: [1.5, 5.5, 21, 12, 1], c: 1 }, // marco
      { rect: [3, 7, 18, 9, 0.4], c: 3 }, // pantalla
      { rect: [11, 17.5, 2, 3], c: 2 }, // pie
      { rect: [7.5, 20, 9, 1.6, 0.6], c: 2 }, // base
    ],
  },

  // Monstera en macetero cilíndrico. El macetero va en acero, no en hueso: el
  // blanco roto se disolvería contra el fondo claro del tablero.
  planta: {
    viewBox: 24,
    palette: { 1: ACERO, 2: VERDE, 3: VERDE_HONDO },
    parts: [
      { rect: [8, 15, 8, 7, 1], c: 1 }, // macetero
      { rect: [11.4, 9, 1.2, 6], c: 3 }, // tallo
      { circle: [8.2, 10.2, 3.4], c: 2 }, // hojas
      { circle: [15.6, 10.6, 3], c: 2 },
      { circle: [12, 6.2, 3.6], c: 3 },
    ],
  },

  // Estantería abierta: montantes finos y baldas voladas.
  estantería: {
    viewBox: 24,
    palette: { 1: NEGRO, 2: ACERO, 3: CRISTAL },
    parts: [
      { rect: [3.5, 3, 1.4, 18], c: 1 }, // montante izquierdo
      { rect: [19.1, 3, 1.4, 18], c: 1 }, // montante derecho
      { rect: [3.5, 8, 17, 1.3], c: 1 }, // balda alta
      { rect: [3.5, 14, 17, 1.3], c: 1 }, // balda baja
      { rect: [6.5, 4.5, 1.8, 3.5], c: 2 }, // objetos, estante superior
      { rect: [9.2, 5.5, 1.8, 2.5], c: 3 },
      { rect: [6.5, 10.5, 1.8, 3.5], c: 3 }, // objetos, estante medio
      { rect: [15, 11, 4, 3], c: 2 },
    ],
  },

  // Silla de carcasa moldeada sobre patas finas.
  silla: {
    viewBox: 24,
    palette: { 1: ACERO, 2: NEGRO },
    parts: [
      { rect: [6.5, 3, 11, 9, 4], c: 1 }, // carcasa del respaldo
      { rect: [4, 11.5, 16, 3, 1.5], c: 1 }, // asiento
      { rect: [6, 14.5, 1.4, 6.5], c: 2 }, // pata izquierda
      { rect: [16.6, 14.5, 1.4, 6.5], c: 2 }, // pata derecha
      { rect: [6, 18.6, 12, 1.1], c: 2 }, // travesaño
    ],
  },

  // Cama de plataforma, de perfil: base baja y volada, cabecero bajo, colchón y
  // colcha a los pies. Misma vista que la de montaña, por coherencia y porque
  // es la que sobrevive a 16 px.
  cama: {
    viewBox: 24,
    palette: { 1: NEGRO, 2: HUESO, 3: ACERO },
    parts: [
      { rect: [2.2, 5.5, 2.2, 8, 0.6], c: 1 }, // cabecero bajo
      { rect: [1.5, 13.5, 21, 3.2, 0.6], c: 1 }, // plataforma
      { rect: [3, 8.8, 18.5, 4.7, 0.8], c: 2 }, // colchón
      { rect: [4, 9.8, 4.6, 3, 0.5], c: 3 }, // almohada
      { rect: [15.5, 8.8, 6, 4.7, 0.8], c: 3 }, // colcha
      { rect: [3.5, 16.7, 1.5, 2.6], c: 1 }, // patas
      { rect: [19, 16.7, 1.5, 2.6], c: 1 },
    ],
  },
}
