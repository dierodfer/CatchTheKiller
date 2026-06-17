// Registro central de "elementos del mapa" (antes "mobiliario").
//
// Única fuente de verdad: cada elemento declara su comportamiento en el tablero
// y su semántica para las pistas. Todo lo demás (generador de mapa, pistas,
// Solver, render) se deriva de aquí, así que añadir, quitar o re-tematizar un
// elemento es un cambio en un solo sitio.
//
// Cada entrada está indexada por un `id` ESTABLE (el valor que se guarda en
// `map.grid`). Los atributos de presentación (`label` y, en el futuro, el icono
// o sprite) se resuelven por ese id: cuando más adelante el nombre/imagen deban
// cambiar dinámicamente según el ambiente/zona, bastará con superponer un mapa
// `id -> { label, icon }` por ambiente sin tocar la lógica del juego.
//
// Campos:
//   - id:       identificador estable (clave en map.grid).
//   - label:    nombre mostrado en las pistas (futuro: variable por ambiente).
//   - article:  artículo indeterminado para concordancia ("una mesa", "un sofá").
//   - blocking: true si bloquea la celda (ningún personaje puede ocuparla).
//   - mueble:   true si se considera "mueble" (alfombra y planta NO lo son).
//   - onText:   frase de la pista "estaba encima de" (solo elementos ocupables).

export const ELEMENTS = {
  // Bloqueantes (no ocupables).
  mesa: { id: 'mesa', label: 'mesa', article: 'una', blocking: true, mueble: true },
  TV: { id: 'TV', label: 'TV', article: 'una', blocking: true, mueble: true },
  planta: { id: 'planta', label: 'planta', article: 'una', blocking: true, mueble: false },
  estantería: { id: 'estantería', label: 'estantería', article: 'una', blocking: true, mueble: true },
  // Libres (ocupables): definen `onText` para la pista "estaba encima de".
  silla: {
    id: 'silla',
    label: 'silla',
    article: 'una',
    blocking: false,
    mueble: true,
    onText: 'Estaba sentado en una silla',
  },
  alfombra: {
    id: 'alfombra',
    label: 'alfombra',
    article: 'una',
    blocking: false,
    mueble: false,
    onText: 'Estaba sobre la alfombra',
  },
  cama: {
    id: 'cama',
    label: 'cama',
    article: 'una',
    blocking: false,
    mueble: true,
    onText: 'Estaba acostado en la cama',
  },
}

// Todos los ids, en orden de declaración.
export const ELEMENT_IDS = Object.keys(ELEMENTS)

const idsWhere = (pred) => ELEMENT_IDS.filter((id) => pred(ELEMENTS[id]))

// Elementos que bloquean la celda (no ocupable). Sustituye a BLOCKING_FURNITURE.
export const BLOCKING_ELEMENTS = idsWhere((e) => e.blocking)

// Elementos "libres": un personaje puede ocupar su celda. Sustituye a FREE_FURNITURE.
export const FREE_ELEMENTS = idsWhere((e) => !e.blocking)

// Elementos considerados "muebles" (para la pista "no estaba junto a ningún
// mueble"). Excluye explícitamente alfombra y planta.
export const MUEBLE_ELEMENTS = idsWhere((e) => e.mueble)

// Elementos candidatos a pistas de proximidad ("Estaba junto a una X"): todos.
export const PROXIMITY_ELEMENTS = ELEMENT_IDS

// Elementos sobre los que un personaje puede estar (pista "encima de"): los que
// declaran `onText` (los ocupables).
export const ON_ELEMENTS = idsWhere((e) => !!e.onText)

// Frase indeterminada "una <elemento>" con el nombre actual del elemento.
// Punto único de indirección para el nombre mostrado (futuro: por ambiente).
export const elementPhrase = (id) => `${ELEMENTS[id].article} ${ELEMENTS[id].label}`

// ¿Este id se considera un "mueble"? (alfombra/planta → false).
export const isMueble = (id) => !!ELEMENTS[id]?.mueble
