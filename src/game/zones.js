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

import { ELEMENTS, ELEMENT_IDS } from './elements.js'

export const ZONE_IDS = ['montana', 'apartamento', 'pixel']

// Zona estable para una semilla dada (reproducible, sin estado adicional).
// Indexa por la longitud de la lista: añadir una cuarta zona no toca esto.
export function zoneForSeed(seed = 0) {
  const n = Math.abs(Math.trunc(seed))
  return ZONE_IDS[n % ZONE_IDS.length]
}

// Campos que una zona puede redefinir. Que la lista viva aquí y se valide más
// abajo es lo que impide que una superposición toque la lógica por descuido.
const PRESENTATION_FIELDS = ['label', 'plural', 'article', 'onText']

// Sustituciones de nombre por zona: `id de elemento -> campos de presentación`.
// Una zona ausente —o un id ausente dentro de una zona— usa el nombre base.
//
// Regla de diseño: la sustitución debe seguir leyéndose como lo que el elemento
// ES para la lógica. Un elemento ocupable (silla, cama, alfombra) tiene que
// seguir siendo algo sobre lo que una persona puede estar, y uno marcado como
// mueble tiene que seguir pareciendo mobiliario.
export const ZONE_ELEMENTS = {
  montana: {
    // Bloqueante y NO mueble, igual que la planta: un montón de leña estorba,
    // pero nadie lo llamaría mobiliario.
    planta: { label: 'leñera', plural: 'leñeras', article: 'una' },
    // Bloqueante y mueble. Un arcón, no una chimenea: la chimenea no es
    // mobiliario, y al conservar `mueble: true` la pista "no estaba junto a
    // ningún mueble" saldría falsa a su lado, que se lee mal.
    TV: { label: 'arcón', plural: 'arcones', article: 'un' },
    // Ocupable: al cambiar de nombre hay que redactar de nuevo el "encima de".
    silla: {
      label: 'banco',
      plural: 'bancos',
      article: 'un',
      onText: 'Estaba sentado en un banco',
    },
  },
  // `apartamento` y `pixel` usan los nombres base: mesa, TV, planta, silla…
  // describen igual de bien un piso moderno y una mansión de 8 bits.
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
      const base = ELEMENTS[id]
      if (!base) throw new Error(`Zona ${zoneId}: elemento desconocido "${id}"`)
      for (const field of Object.keys(over)) {
        if (!PRESENTATION_FIELDS.includes(field)) {
          throw new Error(
            `Zona ${zoneId}: "${id}.${field}" no es un campo de presentación; ` +
              `blocking y mueble son lógica de puzzle y no se pueden redefinir`,
          )
        }
      }
      // Un elemento ocupable se anuncia con su propia frase; si cambia de
      // nombre y no la reescribe, la pista nombraría el elemento equivocado.
      if (base.onText && over.label && !over.onText) {
        throw new Error(
          `Zona ${zoneId}: "${id}" es ocupable y cambia de nombre a "${over.label}", ` +
            `pero no redefine onText`,
        )
      }
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
