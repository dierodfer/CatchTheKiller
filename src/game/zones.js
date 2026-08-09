// Zonas: la parte de la ambientación que la LÓGICA necesita conocer.
//
// Aquí vive solo eso: qué zonas hay, cuál le toca a una semilla y cómo se
// llaman los elementos del mapa en cada una. El aspecto (colores, materiales,
// sprites) vive en `src/components/zones.js`, indexado por estos mismos ids.
// La separación no es cosmética: el texto de las pistas se redacta durante la
// generación del puzzle (ver `clueGenerator.makeClue`), así que los nombres por
// zona tienen que estar disponibles aquí, y `src/game/` no puede depender de
// los componentes.
//
// LÍMITE de la superposición: solo puede redefinir cómo se NOMBRA un elemento
// (`label`, `plural`, `article`, `onText`). Nunca `blocking` ni `mueble`, que
// son lógica de puzzle: `blocking` decide qué celdas son ocupables y `mueble`
// alimenta la pista "no estaba junto a ningún mueble". Tampoco cambia el
// conjunto de ids, que son las claves guardadas en `map.grid`.
//
// Las HABITACIONES se superponen con el mismo principio, más abajo
// (ZONE_ROOMS/resolveRooms): el nombre CANÓNICO (el de `ROOM_NAMES`) sigue
// siendo la identidad real de la sala — la clave de `roomLookup`, la que
// indexa su tinte y su material de suelo — y lo único que cambia por zona es
// cómo se llama en pantalla y en el texto de las pistas.

import { ELEMENTS, ELEMENT_IDS } from './elements.js'
import { ROOM_NAMES, ROOM_ARTICLE } from './constants.js'

export const ZONE_IDS = ['montana', 'apartamento', 'pixel']

// Zona estable para una semilla dada (reproducible, sin estado adicional).
// Indexa por la longitud de la lista: añadir una cuarta zona no toca esto.
export function zoneForSeed(seed = 0) {
  const n = Math.abs(Math.trunc(seed))
  return ZONE_IDS[n % ZONE_IDS.length]
}

// Campos que una zona puede redefinir. Que la lista viva aquí y se valide más
// abajo es lo que impide que una superposición toque la lógica por descuido.
const PRESENTATION_FIELDS = new Set(['label', 'plural', 'article', 'onText'])

// Sustituciones de nombre por zona: `id de elemento -> campos de presentación`.
// Una zona ausente —o un id ausente dentro de una zona— usa el nombre base.
//
// Regla de diseño: la sustitución debe seguir leyéndose como lo que el elemento
// ES para la lógica. Un elemento ocupable (silla, cama, alfombra) tiene que
// seguir siendo algo sobre lo que una persona puede estar, y uno marcado como
// mueble tiene que seguir pareciendo mobiliario.
export const ZONE_ELEMENTS = {
  montana: {
    // La ranura de `planta` es "bloqueante y NO mueble", y una chimenea encaja
    // ahí exactamente: estorba el paso y nadie la llamaría mobiliario, así que
    // la pista "no estaba junto a ningún mueble" sigue siendo cierta a su lado.
    planta: { label: 'chimenea', plural: 'chimeneas', article: 'una' },
    // Bloqueante y mueble: la cómoda ocupa el hueco del televisor sin alterar
    // ninguna de las dos marcas.
    TV: { label: 'cómoda', plural: 'cómodas', article: 'una' },
  },
  // `apartamento` y `pixel` usan los nombres base: mesa, TV, planta, silla…
  // describen igual de bien un piso moderno y una mansión de 8 bits.
}

// Coherencia de UNA superposición de elemento: el id existe, solo toca campos
// de presentación y, si el elemento es ocupable y cambia de nombre, reescribe
// también su frase (si no, la pista nombraría el elemento equivocado).
function assertElementOverlay(zoneId, id, over) {
  const base = ELEMENTS[id]
  if (!base) throw new Error(`Zona ${zoneId}: elemento desconocido "${id}"`)

  for (const field of Object.keys(over)) {
    if (!PRESENTATION_FIELDS.has(field)) {
      throw new Error(
        `Zona ${zoneId}: "${id}.${field}" no es un campo de presentación; ` +
          `blocking y mueble son lógica de puzzle y no se pueden redefinir`,
      )
    }
  }

  if (base.onText && over.label && !over.onText) {
    throw new Error(
      `Zona ${zoneId}: "${id}" es ocupable y cambia de nombre a "${over.label}", ` +
        `pero no redefine onText`,
    )
  }
}

// Coherencia de las superposiciones. Son datos estáticos, así que basta con
// comprobarlos una vez al cargar el módulo: un tema mal definido falla al
// arrancar (y en `npm run test:logic`), no a mitad de una partida.
function assertZoneElements() {
  for (const [zoneId, overlay] of Object.entries(ZONE_ELEMENTS)) {
    if (!ZONE_IDS.includes(zoneId)) {
      throw new Error(`ZONE_ELEMENTS: zona desconocida "${zoneId}"`)
    }
    for (const [id, over] of Object.entries(overlay)) {
      assertElementOverlay(zoneId, id, over)
    }
  }
}

assertZoneElements()

// Tablas resueltas, una por zona. Se precalculan porque son constantes: así
// `resolveElements` devuelve siempre la misma referencia y la generación de
// puzzles (que reintenta varias veces) no reconstruye el objeto en cada vuelta.
const RESOLVED = Object.fromEntries(
  ZONE_IDS.map((zoneId) => {
    const overlay = ZONE_ELEMENTS[zoneId]
    if (!overlay) return [zoneId, ELEMENTS]
    const table = {}
    for (const id of ELEMENT_IDS) {
      table[id] = overlay[id] ? { ...ELEMENTS[id], ...overlay[id] } : ELEMENTS[id]
    }
    return [zoneId, table]
  }),
)

// Tabla de elementos con los nombres de la zona aplicados. Sin zona (o con una
// desconocida) devuelve los nombres base — es lo que usan el Solver y los tests,
// que evalúan predicados y nunca leen la redacción.
export const resolveElements = (zoneId) => RESOLVED[zoneId] ?? ELEMENTS

// ─────────────────────────────────────────────────────────────────────────
// Habitaciones
// ─────────────────────────────────────────────────────────────────────────

// Sustituciones de nombre de HABITACIÓN por zona: `nombre canónico -> {label,
// article}`. Van juntos porque cambiar de nombre casi siempre cambia de
// género ("la Terraza" -> "el Porche"), y separarlos en dos superposiciones
// independientes habría dejado fácil olvidar el artículo al renombrar.
//
// Una zona ausente —o una sala ausente dentro de una zona— conserva el
// nombre y el artículo canónicos de `ROOM_NAMES`/`ROOM_ARTICLE`.
export const ZONE_ROOMS = {
  montana: {
    Salón: { label: 'Sala', article: 'la' },
    Dormitorio: { label: 'Alcoba', article: 'la' },
    // La ranura de Estudio pasa a ser el cuarto de armas de la cabaña.
    Estudio: { label: 'Armería', article: 'la' },
    Terraza: { label: 'Porche', article: 'el' },
    // No "Leñera": ese nombre ya lo usó una versión anterior de ZONE_ELEMENTS
    // para el elemento `planta` y se descartó a favor de "chimenea" — libre
    // para la habitación, sin colisión con ningún elemento actual.
    Bodega: { label: 'Leñera', article: 'la' },
    Galería: { label: 'Esquís', article: 'el' },
    // Cocina, Pasillo, Comedor y Biblioteca se quedan con su nombre base: son
    // igual de propios de una cabaña que de cualquier otra casa.
  },
  apartamento: {
    Salón: { label: 'Living', article: 'el' },
    Dormitorio: { label: 'Habitación', article: 'la' },
    Estudio: { label: 'Despacho', article: 'el' },
    Terraza: { label: 'Balcón', article: 'el' },
    Bodega: { label: 'Trastero', article: 'el' },
    Galería: { label: 'Vestidor', article: 'el' },
  },
  // `pixel` conserva los diez nombres canónicos: es la ambientación "de
  // referencia", la que no re-tematiza ni el vocabulario.
}

// Tabla de los diez nombres base, en la forma {label, article} — el punto de
// partida sobre el que cada zona superpone sus cambios.
const BASE_ROOMS = Object.fromEntries(
  ROOM_NAMES.map((room) => [room, { label: room, article: ROOM_ARTICLE[room] }]),
)

// Coherencia de las superposiciones, comprobada una vez al cargar el módulo
// (igual que `assertZoneElements`): una zona mal definida falla al arrancar,
// no a mitad de una partida. Dos invariantes:
//   - la sala existe en `ROOM_NAMES` y el artículo es 'el' o 'la';
//   - dentro de una misma zona, dos salas nunca terminan con el MISMO nombre
//     en pantalla (eso confundiría al jugador sobre cuál es cuál).
function assertRoomOverlay(zoneId, room, over) {
  if (!ROOM_NAMES.includes(room)) throw new Error(`Zona ${zoneId}: habitación desconocida "${room}"`)
  if (!over.label) throw new Error(`Zona ${zoneId}: "${room}" no define label`)
  if (over.article !== 'el' && over.article !== 'la') {
    throw new Error(`Zona ${zoneId}: "${room}" tiene un artículo inválido ("${over.article}")`)
  }
}

// Dos salas de una misma zona nunca pueden acabar con el mismo nombre en
// pantalla: el jugador no sabría cuál es cuál. Se comprueba sobre las diez
// salas resueltas, no solo sobre las redefinidas, porque una colisión puede
// darse entre una sala renombrada y otra que conserva su nombre canónico.
function assertUniqueRoomLabels(zoneId, overlay) {
  const labelOwner = new Map() // nombre en pantalla -> sala canónica que lo usa
  for (const room of ROOM_NAMES) {
    const label = overlay[room]?.label ?? room
    if (labelOwner.has(label)) {
      throw new Error(
        `Zona ${zoneId}: "${room}" y "${labelOwner.get(label)}" comparten el nombre "${label}"`,
      )
    }
    labelOwner.set(label, room)
  }
}

function assertZoneRooms() {
  for (const [zoneId, overlay] of Object.entries(ZONE_ROOMS)) {
    if (!ZONE_IDS.includes(zoneId)) throw new Error(`ZONE_ROOMS: zona desconocida "${zoneId}"`)
    for (const [room, over] of Object.entries(overlay)) {
      assertRoomOverlay(zoneId, room, over)
    }
    assertUniqueRoomLabels(zoneId, overlay)
  }
}

assertZoneRooms()

const RESOLVED_ROOMS = Object.fromEntries(
  ZONE_IDS.map((zoneId) => [zoneId, { ...BASE_ROOMS, ...ZONE_ROOMS[zoneId] }]),
)

// Tabla de habitaciones con los nombres de la zona aplicados. Sin zona (o con
// una desconocida) devuelve los nombres base.
export const resolveRooms = (zoneId) => RESOLVED_ROOMS[zoneId] ?? BASE_ROOMS
