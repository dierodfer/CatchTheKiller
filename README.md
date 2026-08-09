<p align="center">
  <img src="public/icon-512.png" width="120" alt="Catch the Killer" />
</p>

# Catch the Killer

🔗 **Juega ahora en GitHub Pages:** https://dierodfer.github.io/CatchTheKiller/

**Reconstruye la escena del crimen, casilla a casilla.** Sitúa a cada
sospechoso en el mapa siguiendo las pistas, sin repetir fila ni columna con
nadie más. Cuando el tablero encaja, **el asesino se delata solo**: es quien
se queda a solas con la víctima en su habitación. Sin azar, sin trampas —
pura deducción, con cuatro dificultades y mapas irregulares para rejugar.

> Implementación **100% local**: la generación del mapa, la solución, las pistas
> y el Solver son lógica interna en JavaScript puro. No se llama a ninguna IA ni
> servicio externo.

<p align="center">
  <img src="docs/screenshots/tablero-dificil.png" width="720" alt="Tablero de un caso en dificultad Difícil (6×6), con mapa irregular tipo donut" />
</p>

<p align="center"><sub>Caso en dificultad <strong>Difícil</strong> (6×6) con mapa irregular (forma "donut", con patio interior).</sub></p>

## Stack

| Componente        | Tecnología            | Por qué |
|-------------------|-----------------------|---------|
| Framework / build | **React 18 + Vite**   | Estándar ligero y rápido |
| Estilos           | **Tailwind CSS**      | Utilidades sin runtime |
| Iconos            | **lucide-react**      | Ligero y tree-shakeable, recomendado por la comunidad |
| Animaciones       | **framer-motion**     | La librería de animación más usada en React (layout, transiciones, reveals) |
| Drag & drop       | **@dnd-kit/core**     | Accesible y ligero; además hay *click-to-place* como alternativa |
| Estado            | **useReducer**        | Máquina de estados de la app (sección 13 del diseño) |

Sin toasts (decisión de diseño): el feedback se da en paneles y overlays.

## Dirección visual — "Botanica at Dawn"

Sistema de diseño cohesivo, premium y cálido (apps de _wellness_/_journaling_,
nunca casino): fondos cálidos en **crema/marfil**, **ciruela/plum** oscuro como
tinta de texto, **dorado** como acento principal, **verde sage** para el éxito
y **rosa polvoriento** para el error. Tipografía con carácter: serif editorial
**Cormorant Garamond** para los títulos + **Inter** para la interfaz. Los
tokens de color y tipografía viven en `src/index.css` (`@theme` de Tailwind v4).

- **Tres ambientaciones**, repartidas por la semilla del puzzle:
  - **Casa de montaña** — roble, hierro y lana; suelo de tarima, muros de
    nogal y alfombra de lana bereber.
  - **Apartamento en la ciudad** — un piso alto de rascacielos: cristal,
    acero y hormigón, baldosa de gran formato, ventanales de marco fino y
    alfombra de sisal.
  - **Mansión 8-bit** — el pixel art original, con su damero, su dorado, sus
    sprites de 8×8 y un kilim de bandas a todo color.

  Las dos primeras dibujan el mobiliario con sprites reales de Kenney
  (`furnitureSprites.js`, un set propio por zona); la tercera, con el emisor de
  pixel art original (`pixelArt.jsx`). La zona se parte en dos capas:
  `src/game/zones.js` guarda lo que la lógica necesita —qué zona toca a cada
  semilla y cómo se llama cada elemento en ella— y `src/components/zones.js`,
  cómo se ve (mobiliario, tintas, muros, ventanas, suelo y alfombra).

  Una zona puede **renombrar** elementos y habitaciones sin tocar la lógica:
  en la casa de montaña la `planta` es una *chimenea* y la `Terraza` es el
  *Porche*, pero el id canónico sigue siendo la clave real que indexa material,
  tinte y las marcas `blocking`/`mueble` del puzzle — solo cambia la palabra
  que ve el jugador. Una aserción al cargar el módulo impide sustituciones que
  rompan esa correspondencia. La mansión 8-bit no redefine nada: conserva el
  vocabulario canónico.

- **Suelo**: en montaña y apartamento, un sprite de 16×16 px por tipo de
  habitación (`floorMaterials.js` + `floorSprites.js`, Kenney) elegido por
  **nombre** de sala —la Cocina siempre lleva damero, la Bodega ladrillo—,
  teñido con el `filter` de la zona. La mansión 8-bit usa en cambio
  `floor.pattern`: el mismo damero CSS en las diez salas (el original del
  proyecto), porque ahí el suelo no tiene que distinguir una habitación de
  otra —de eso ya se encarga el tinte— sino sostener la textura pixelada del
  conjunto.
- **Alfombra en tres capas** (`Rug.jsx` + `rugLayerStyles`): una sola capa a
  nivel de tablero —no por celda— sobre el rectángulo que ocupa (de una tira
  de 1×6 a un bloque de 3×2, ver `placeRug` en `mapGenerator.js`). Debajo, el
  **suelo de la habitación**; encima, el **ribete** (fino y discreto, propio de
  cada zona) separado del muro por un margen (`insetFrac`) para que no se lea
  como moqueta empotrada; dentro, el **tejido**. Ribete y tejido llevan cada
  uno su propio `filter` — si compartieran el de la zona, esta no podría
  colorear uno sin arrastrar el otro. La mansión 8-bit es la única con esquina
  en pico (`radiusFrac: 0`): en una rejilla de píxeles no hay curvas.
- **Texturas de alfombra** (`rugTextures.js`): cuatro tiles de 64×64 px a
  **resolución de hilo** —trama, hebra o nudo, no un degradado CSS a rayas—
  que embaldosan sin costura: `kilim` (bandas y galones), `berber` (fibra
  corta con enrejado de rombos), `sisal` (esterilla de hebras cruzadas) y
  `persa` (medallones sobre campo granate). La zona elige cuál usa
  (`zone.rug.texture`) y la tiñe con su propio `filter`: montaña lleva
  `berber`, el apartamento `sisal`, la mansión 8-bit `kilim`.
- **Celebración al resolver**: al cerrar el caso de verdad, la escena se
  ilumina **habitación por habitación** sobre el tablero (Framer Motion) y un
  overlay editorial con pétalos dorados presenta el desenlace.
- **Accesibilidad**: contraste cuidado sobre el fondo claro, foco visible en
  dorado y respeto de `prefers-reduced-motion` (global en CSS + `useReducedMotion`
  en los componentes animados). Diseño _mobile-first_ y responsive.

### ¿Se usa TypeScript?

**No.** El proyecto está en JavaScript puro (`.js` / `.jsx`), sin `tsconfig.json`
ni archivos `.ts`/`.tsx`. Las dependencias `@types/react` y `@types/react-dom`
solo se incluyen para que el editor ofrezca autocompletado y tipado de las
props de React sobre los `.jsx`, pero no hay comprobación de tipos en el build
ni en el lint. Si se quisiera migrar a TypeScript más adelante, el código de
`src/game/` (sin JSX, lógica pura) sería el más sencillo de tipar primero.

## Cómo ejecutar

```bash
npm install
npm run dev        # desarrollo (http://localhost:5173)
npm run build      # build de producción en dist/
npm run preview    # sirve el build
npm run test:logic # smoke test de la lógica de generación (sin UI)
```

## Despliegue a GitHub Pages

El workflow `.github/workflows/deploy.yml` construye el proyecto y lo publica
en GitHub Pages automáticamente con cada push a `main` (o manualmente desde la
pestaña *Actions*).

Para activarlo, en el repositorio: **Settings → Pages → Build and deployment →
Source: "GitHub Actions"**. La app quedará disponible en
`https://<usuario>.github.io/<repositorio>/`. El `base: './'` en
`vite.config.js` hace que las rutas de los assets sean relativas, por lo que
funciona en cualquier subruta sin tocar configuración adicional.

## Arquitectura

La lógica del juego vive en `src/game/` y es independiente de la UI:

### Elementos del mapa (`src/game/elements.js`)

Registro central de todos los objetos que pueden aparecer en el tablero. Cada
elemento se identifica por un `id` estable (el valor en `map.grid`). Los
atributos de presentación (`label`, y en el futuro icono/sprite) se resuelven
por ese id, lo que permite re-tematizar nombre e imagen por ambiente/zona sin
tocar la lógica del juego.

| id | label | blocking | mueble | pista "encima de" |
|----|-------|:--------:|:------:|-------------------|
| `mesa` | mesa | sí | sí | — |
| `TV` | TV | sí | sí | — |
| `planta` | planta | sí | no | — |
| `estantería` | estantería | sí | sí | — |
| `silla` | silla | no | sí | *Estaba sentado en una silla* |
| `alfombra` | alfombra | no | no | *Estaba sobre la alfombra* |
| `cama` | cama | no | sí | *Estaba acostado en la cama* |

- **blocking**: la celda queda inaccesible; ningún personaje puede ocuparla.
- **mueble**: solo los marcados como mueble cuentan para la pista *"No estaba
  junto a ningún mueble"*. Planta y alfombra no se consideran muebles.
- **Todos** los elementos pueden aparecer en pistas de proximidad (*"Estaba
  junto a una X"*), incluidas planta y alfombra.
- Listas derivadas: `BLOCKING_ELEMENTS`, `FREE_ELEMENTS`, `MUEBLE_ELEMENTS`,
  `PROXIMITY_ELEMENTS`, `ON_ELEMENTS`.

### Estructura de archivos

```
src/game/
  elements.js           Registro central de elementos del mapa (ver tabla arriba)
  constants.js          Dificultades, habitaciones, parámetros de generación
  random.js             PRNG determinista (semilla reproducible)
  mapGenerator.js       Cuadrícula + habitaciones irregulares + mobiliario + ventanas
  solutionGenerator.js  Coloca personajes (filas/columnas propias) garantizando 1 asesino
  killerRule.js         Regla del asesino (a solas con la víctima en su sala, líneas despejadas)
  clues.js              Catálogo de tipos de pista + evaluador verificable
  clueGenerator.js      Deriva pistas de la solución y busca solución única
  hints.js              Elige qué pista adicional conceder según el tablero
  solver.js             Autoridad final: unicidad, validación, identifica al asesino
  puzzleGenerator.js    Orquesta: mapa → solución → pistas → validación
```

Flujo de generación (sección 6 del diseño), todo local:

```
GENERAR MAPA → GENERAR SOLUCIÓN → GENERAR PISTAS → SOLVER (unicidad) → VALIDACIÓN
```

El Solver es la **autoridad final**: ningún conjunto de pistas se acepta sin que
el Solver confirme que produce exactamente una reconstrucción válida (con
exactamente un asesino). Si un sospechoso queda ambiguo, se añade una pista
adicional para él (sección 6.4) y luego se minimizan las redundantes.

### UI (`src/components/`)

- `Board` / `Cell` — cuadrícula con **filas y columnas numeradas**, habitaciones,
  mobiliario, ventanas y la **línea de control** (un aspa en cada celda de la
  fila y la columna de cada ficha colocada, en tiempo real; útil para comprobar
  que ningún personaje comparte fila ni columna con otro). El aspa es SVG
  vectorial, escalable sin perder nitidez (`ControlMark.jsx` +
  `controlMarks.js`, cuatro variantes disponibles, activa en `CONTROL_MARK`) y
  no se tematiza: es una señal de juego igual en las tres zonas. Las ventanas
  se dibujan sobre la pared de la celda (no en el suelo) y son ocupables. Las
  alfombras pueden ocupar entre 2 y 6 celdas formando una región rectangular.
- `CharacterTray` — fichas sin colocar (orden alfabético), situada justo encima
  del tablero; zona para descolocar.
- `CluePanel` — pistas agrupadas por personaje (orden alfabético), marcables como
  usadas. Ninguna pista referencia a la víctima. Las pistas adicionales se
  representan como **lupas** en pixel art (una por pista disponible, según la
  dificultad): tocar una la gasta y su aro dorado pasa a gris tachado. La pista
  que se concede depende *del tablero*, no del azar: primero sobre los
  personajes que el jugador aún no ha colocado y después sobre los que están
  mal colocados (`src/game/hints.js`).
- `Toolbar` — Resolver, Resolución (revela la solución tras un aviso), Nuevo.
- `ResultBanner` — WIN revela al asesino y la habitación del crimen (se puede
  cerrar para inspeccionar el tablero); FAIL indica que hay errores **sin revelar
  la solución**.
- `MapPreview` — previsualización de solo lectura del tipo de mapa que generará
  la dificultad seleccionada, visible en la pantalla de inicio.

Colocación por **arrastre** (dnd-kit) o **click-to-place** (seleccionar ficha y
pulsar la celda).

## Estado del proyecto

Primer hito jugable de extremo a extremo para las cuatro dificultades
(4×4 / 5×5 / 6×6 / 7×7). La capa de generación es local; si en el futuro se
quiere delegar la generación de solución/pistas a un modelo, basta con
sustituir `solutionGenerator` + `clueGenerator` respetando el contrato de
datos (sección 10 del diseño), manteniendo el Solver como autoridad final.

La partida en curso se guarda localmente (`localStorage`) y se ofrece
continuarla si se recarga la página a mitad de un caso.

Cuestiones aún abiertas del diseño (sección 15): revelado progresivo de pistas,
sistema de puntuación y multijugador.

## Créditos y licencias de terceros

- **Roguelike/RPG pack** (Kenney) — los 10 sprites de suelo
  (`src/components/floorSprites.js`) y los 12 sprites de mobiliario de «Casa de
  montaña» y «Apartamento en la ciudad» (`furnitureSprites.js`, 6 elementos ×
  2 zonas). Licencia CC0 1.0 (dominio público, no exige atribución); texto de
  cortesía en
  [`LICENSES/kenney-roguelike-rpg-pack-CC0.txt`](LICENSES/kenney-roguelike-rpg-pack-CC0.txt).
  Cada sprite es un recorte de 16×16 px del spritesheet oficial, embebido como
  PNG en base64: cero peticiones en tiempo de ejecución, porque la app es una
  PWA offline.
- El pixel art de la zona «Mansión 8-bit», los retratos de los personajes y la
  lupa son originales del proyecto.
