// Arte plano de la CASA DE MONTAÑA: roble macizo, hierro forjado y lana.
//
// Indexado por el `id` estable de `game/elements.js`, NO por el nombre que la
// zona les da: en montaña `planta` se dibuja como una leñera y `TV` como un
// arcón (ver `ZONE_ELEMENTS` en game/zones.js). El id es lo que se guarda en
// `map.grid`; el nombre y el dibujo son las dos caras de la ambientación.
//
// Formato (ver flatArt.jsx): `viewBox` cuadrado, paleta de 2-3 tintas planas y
// una lista de primitivas — `rect: [x, y, w, h, rx?]`, `circle: [cx, cy, r]` o
// `path: 'M…'` — donde `c` es el índice de paleta.
//
// Detalle mínimo ~1.5 unidades: por debajo desaparece cuando el tablero se
// comprime a 36 px de celda y el sprite se dibuja a ~16 px.
//
// `alfombra` no está aquí a propósito: es una capa de fondo que abarca varias
// celdas (ver `rugLayerStyles`), no un icono centrado en una.

const ROBLE = '#a9763f'
const NOGAL = '#5c3a1e'
const HIERRO = '#3d3a36'
const LANA = '#efe2cc'
const TERRACOTA = '#a8563a'

export const FURNITURE_MONTANA = {
  // Mesa de roble macizo: tablero grueso, patas cuadradas y chambrana baja.
  mesa: {
    viewBox: 24,
    palette: { 1: ROBLE, 2: NOGAL },
    parts: [
      { rect: [1.5, 7, 21, 3.5, 1], c: 1 }, // tablero
      { rect: [4, 10.5, 3, 10], c: 2 }, // pata izquierda
      { rect: [17, 10.5, 3, 10], c: 2 }, // pata derecha
      { rect: [5.5, 15, 13, 1.8], c: 2 }, // chambrana
    ],
  },

  // Arcón de tapa recta con dos herrajes verticales y cierre central.
  TV: {
    viewBox: 24,
    palette: { 1: ROBLE, 2: NOGAL, 3: HIERRO },
    parts: [
      { rect: [2.5, 9, 19, 11, 1.5], c: 1 }, // cuerpo
      { rect: [2.5, 6.5, 19, 3.5, 1.5], c: 2 }, // tapa
      { rect: [6, 6.5, 2, 13.5], c: 3 }, // herraje izquierdo
      { rect: [16, 6.5, 2, 13.5], c: 3 }, // herraje derecho
      { rect: [10.5, 12, 3, 3, 0.5], c: 3 }, // cierre
    ],
  },

  // Leñera: troncos apilados vistos de testa dentro de un cajón de madera.
  planta: {
    viewBox: 24,
    palette: { 1: NOGAL, 2: ROBLE, 3: '#d9b183' },
    parts: [
      { rect: [2, 8, 20, 12, 1], c: 1 }, // cajón
      { circle: [7, 12.5, 2.6], c: 2 }, // troncos, fila superior
      { circle: [12.5, 12.5, 2.6], c: 3 },
      { circle: [18, 12.5, 2.6], c: 2 },
      { circle: [9.5, 17.2, 2.6], c: 3 }, // troncos, fila inferior
      { circle: [15, 17.2, 2.6], c: 2 },
    ],
  },

  // Estantería rústica: montantes gruesos, dos baldas y unos libros.
  estantería: {
    viewBox: 24,
    palette: { 1: NOGAL, 2: ROBLE, 3: TERRACOTA },
    parts: [
      { rect: [3, 3, 2.5, 18], c: 1 }, // montante izquierdo
      { rect: [18.5, 3, 2.5, 18], c: 1 }, // montante derecho
      { rect: [3, 9, 18, 2, 0.3], c: 2 }, // balda media
      { rect: [3, 15, 18, 2, 0.3], c: 2 }, // balda baja
      { rect: [6.5, 4.5, 2, 4.5], c: 3 }, // libros, estante superior
      { rect: [9.2, 5.5, 2, 3.5], c: 2 },
      { rect: [6.5, 11, 2, 4], c: 2 }, // libros, estante medio
      { rect: [9.2, 11.5, 2, 3.5], c: 3 },
    ],
  },

  // Banco de tablones: asiento corrido y respaldo de dos listones.
  silla: {
    viewBox: 24,
    palette: { 1: ROBLE, 2: NOGAL },
    parts: [
      { rect: [4.5, 4, 2.2, 7.5], c: 2 }, // montante izquierdo del respaldo
      { rect: [17.3, 4, 2.2, 7.5], c: 2 }, // montante derecho
      { rect: [4.5, 5, 15, 1.8, 0.4], c: 1 }, // listón superior
      { rect: [4.5, 8, 15, 1.8, 0.4], c: 1 }, // listón inferior
      { rect: [3, 11, 18, 2.8, 0.6], c: 1 }, // asiento
      { rect: [4.5, 13.8, 2.2, 6.5], c: 2 }, // pata izquierda
      { rect: [17.3, 13.8, 2.2, 6.5], c: 2 }, // pata derecha
    ],
  },

  // Cama de perfil: cabecero de madera, colchón de lana, almohada y manta a los
  // pies. De perfil y no cenital a propósito — es la única vista que sigue
  // leyéndose como una cama cuando el sprite baja a 16 px.
  cama: {
    viewBox: 24,
    palette: { 1: NOGAL, 2: LANA, 3: TERRACOTA },
    parts: [
      { rect: [2, 4, 3.2, 15, 0.8], c: 1 }, // cabecero
      { rect: [2, 13.8, 20, 3, 0.6], c: 1 }, // base
      { rect: [5.2, 9, 16.8, 5, 0.8], c: 2 }, // colchón
      { rect: [6.2, 10, 4, 3.2, 0.6], c: 3 }, // almohada
      { rect: [16.5, 9, 5.5, 5, 0.8], c: 3 }, // manta
      { rect: [18.4, 9, 1.2, 5], c: 2 }, // raya de lana
      { rect: [19.5, 16.8, 2.2, 3.4], c: 1 }, // pata a los pies
    ],
  },
}
