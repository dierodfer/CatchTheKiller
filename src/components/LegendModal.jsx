// Leyenda del tablero: qué casillas se pueden ocupar y cuáles no, con el
// nombre y el dibujo QUE LES DA LA ZONA activa.
//
// Existe porque el tablero solo enseña dibujos: nada en pantalla dice que la
// estantería estorba y la cama no, ni cómo se llama en esta ambientación el
// mueble que la pista acaba de nombrar. Y el problema se agrava con las zonas:
// el mismo id `planta` es una maceta en el apartamento y una chimenea en la
// casa de montaña, así que una leyenda impresa a mano quedaría mintiendo en
// dos de cada tres partidas.
//
// De ahí las dos reglas de este archivo:
//
//   · La LISTA sale de `elements.js` (FREE_ELEMENTS / BLOCKING_ELEMENTS), no
//     se escribe aquí. Añadir un elemento al registro lo trae solo, y del lado
//     correcto de la leyenda, sin tocar este componente.
//   · Los NOMBRES salen de `resolveElements(zone.id)` y los DIBUJOS de
//     `FurnitureIcon` con la zona — las mismas dos fuentes que usan las pistas
//     y el tablero. Ninguna cadena de texto de un elemento se repite aquí.
//
// Las miniaturas se pintan con las primitivas del tablero (`boardCell.js`), no
// con iconos aparte: la leyenda tiene que enseñar exactamente lo que el
// jugador va a ver en la casilla, suelo y tinte incluidos.

import { Ban, Footprints, Sparkles } from 'lucide-react'
import { BLOCKING_ELEMENTS, FREE_ELEMENTS, ELEMENT_IDS, elementPhrase } from '@/game/elements.js'
import { resolveElements } from '@/game/zones.js'
import {
  WINDOW_BORDER_SIDE,
  floorPatternStyle,
  rugLayerStyles,
  windowBorder,
  windowGlassStyle,
} from './boardCell.js'
import { roomIndexByName } from './floorMaterials.js'
import { FurnitureIcon } from './Furniture.jsx'
import { ControlMark } from './ControlMark.jsx'
import { SUSPECT_COLORS } from './palette.js'
import ModalShell from './ModalShell.jsx'

// Lado de la miniatura, en px. Es holgado a propósito: por debajo de ~50 px los
// sprites de 16×16 escalados dejan de leerse y la leyenda deja de servir para
// reconocer el elemento en el tablero, que es todo su cometido.
const TILE = 56

// Sala de referencia de las miniaturas. Todas comparten una para que la
// comparación entre casillas sea limpia —lo que cambia de una tarjeta a otra es
// el elemento, no el suelo—, y es el Salón porque es la sala que sale en todos
// los mapas.
const PREVIEW_ROOM = 'Salón'

// La alfombra no tiene sprite: en el tablero es una capa a nivel de tablero
// (ver Rug.jsx), así que su miniatura se dibuja aparte con las mismas capas.
const RUG_ID = 'alfombra'

// Pared de la ventana de muestra: la de arriba, la única que se lee entera en
// una miniatura suelta (una lateral queda pegada al texto de al lado).
const PREVIEW_WALL = 'norte'

// Casilla de muestra: tinte de sala + suelo de la zona, igual que Cell.jsx.
// `children` se apila encima (mobiliario, cristal, aspa…).
function Tile({ zone, children, style }) {
  const tint = zone.tints[roomIndexByName(PREVIEW_ROOM) % zone.tints.length]
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-lg ring-1 ring-plum-900/10"
      style={{ width: TILE, height: TILE, background: tint, ...style }}
      aria-hidden="true"
    >
      <div className="absolute inset-0" style={floorPatternStyle(zone, PREVIEW_ROOM, TILE)} />
      {children}
    </div>
  )
}

// Miniatura de un elemento del mapa. La alfombra se compone con sus tres capas
// (suelo, ribete y tejido); el resto es el mismo icono que pinta la celda.
function ElementTile({ zone, id }) {
  if (id === RUG_ID) {
    const { inset, frame, fill } = rugLayerStyles(zone, TILE)
    return (
      <Tile zone={zone}>
        <div className="absolute box-border" style={{ inset, ...frame }}>
          <div className="absolute inset-0" style={fill} />
        </div>
      </Tile>
    )
  }
  return (
    <Tile zone={zone}>
      <div className="absolute inset-0 flex items-center justify-center opacity-75">
        <FurnitureIcon type={id} zone={zone} size={Math.round(TILE * 0.5)} />
      </div>
    </Tile>
  )
}

// Una entrada de la leyenda: miniatura + nombre + una línea de qué significa.
// La etiqueta "mueble" solo aparece donde el elemento lo es, porque es lo que
// decide una pista concreta (ver la nota al pie de la sección de bloqueantes).
//
// `capitalized` se pide explícitamente porque los nombres de elemento llegan en
// minúscula del registro ("silla") y hay que levantarles la inicial, mientras
// que los rótulos escritos aquí ya vienen bien escritos: aplicar `capitalize` a
// todos dejaba "Línea De Control".
function LegendItem({ tile, name, note, tag, capitalized = false }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-gold/12 bg-cream-50/70 p-2.5">
      {tile}
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-1.5 text-[14px] font-semibold text-plum-900">
          <span className={capitalized ? undefined : 'first-letter:uppercase'}>{name}</span>
          {tag && (
            <span className="rounded-full bg-cream-300/70 px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.08em] text-plum-700">
              {tag}
            </span>
          )}
        </p>
        {note && <p className="text-[12.5px] leading-snug text-plum-700">{note}</p>}
      </div>
    </li>
  )
}

function Section({ icon: Icon, tone, title, hint, children, footnote }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className={`flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em] ${tone}`}>
        <Icon size={15} className="shrink-0" />
        {title}
      </h3>
      <p className="mb-2.5 mt-1 text-[13px] leading-snug text-plum-700">{hint}</p>
      <ul className="grid gap-2 sm:grid-cols-2">{children}</ul>
      {footnote && <p className="mt-2 text-[12px] leading-snug text-plum-600">{footnote}</p>}
    </section>
  )
}

export default function LegendModal({ open, onClose, zone }) {
  // Nombres de la zona activa: los mismos que leerá en las pistas.
  const el = resolveElements(zone.id)
  // Los que NO cuentan como mueble, nombrados por la zona (en la casa de
  // montaña, "chimenea" en vez de "planta"). Se derivan para que la nota al
  // pie no pueda contradecir al registro.
  const noMueble = ELEMENT_IDS.filter((id) => !el[id].mueble).map((id) => el[id].label)

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      labelledBy="legend-title"
      closeOnEscape
      showCloseButton
      // Alto acotado y scroll DENTRO del cuerpo, no en la página: la leyenda
      // crece con el número de elementos y en móvil apaisado ya no cabe
      // entera. La cabecera se queda fija para no perder de vista de qué
      // ambientación se está hablando mientras se baja.
      panelClassName="flex max-h-[85vh] w-full max-w-lg flex-col"
    >
      <header className="shrink-0 px-7 pb-3 pt-7">
        <h2 id="legend-title" className="pr-10 font-serif text-2xl font-semibold text-plum-900">
          Elementos del tablero
        </h2>
        <p
          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-cream-200/70 px-2.5 py-1 text-[12px] font-medium text-plum-800"
          style={{ boxShadow: `inset 0 0 0 1px ${zone.accentSoft}` }}
        >
          <zone.icon size={12} style={{ color: zone.accent }} />
          {zone.label}
        </p>
        <p className="mt-2 text-[13px] leading-snug text-plum-700">
          Cada ambientación cambia el nombre y el dibujo de los elementos, pero no lo que
          hacen: esto es lo que ves en <span className="font-medium">esta</span> partida.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-7">
        <Section
          icon={Footprints}
          tone="text-sage-deep"
          title="Sí se pueden ocupar"
          hint="Puedes soltar una ficha encima. Las pistas los nombran así:"
        >
          {FREE_ELEMENTS.map((id) => (
            <LegendItem
              key={id}
              tile={<ElementTile zone={zone} id={id} />}
              name={el[id].label}
              note={`«${el[id].onText}»`}
              tag={el[id].mueble ? 'mueble' : undefined}
            />
          ))}
        </Section>

        <Section
          icon={Ban}
          tone="text-rose-deep"
          title="No se pueden ocupar"
          hint={`Ocupan la casilla entera y ninguna ficha cabe encima. Las pistas sí los nombran: «Estaba junto a ${elementPhrase(el, BLOCKING_ELEMENTS[0])}».`}
          footnote={
            noMueble.length > 0
              ? `«Mueble» importa para la pista «No estaba junto a ningún mueble»: ${noMueble.join(' y ')} no cuentan como tal.`
              : undefined
          }
        >
          {BLOCKING_ELEMENTS.map((id) => (
            <LegendItem
              key={id}
              tile={<ElementTile zone={zone} id={id} />}
              name={el[id].label}
              tag={el[id].mueble ? 'mueble' : undefined}
            />
          ))}
        </Section>

        <Section
          icon={Sparkles}
          tone="text-gold-deep"
          title="Otras señales"
          hint="No son elementos del mapa, pero se dibujan sobre él."
        >
          <LegendItem
            tile={
              <Tile zone={zone} style={{ [WINDOW_BORDER_SIDE[PREVIEW_WALL]]: windowBorder(zone, 5) }}>
                <div className="absolute" style={windowGlassStyle(zone, PREVIEW_WALL, 8)} />
              </Tile>
            }
            name="Ventana"
            capitalized
            note="Va en la pared, no en el suelo: su casilla sí es ocupable."
          />
          <LegendItem
            tile={
              <Tile zone={zone}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ControlMark size={Math.round(TILE * 0.5)} />
                </div>
              </Tile>
            }
            name="Línea de control"
            capitalized
            note="Fila y columna de una ficha ya colocada: ahí no va nadie más."
          />
          <LegendItem
            tile={
              <Tile zone={zone}>
                <div className="absolute inset-0 flex items-end justify-center gap-px p-1">
                  {['A', 'C'].map((initial, i) => (
                    <span
                      key={initial}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold leading-none text-white"
                      style={{
                        background: SUSPECT_COLORS[i].bg,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                      }}
                    >
                      {initial}
                    </span>
                  ))}
                </div>
              </Tile>
            }
            name="Tus anotaciones"
            capitalized
            note="Iniciales de los sospechosos que has marcado como candidatos."
          />
        </Section>
      </div>
    </ModalShell>
  )
}
