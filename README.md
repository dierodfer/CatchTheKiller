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
    nogal y alfombra de kilim.
  - **Apartamento en la ciudad** — un piso alto de rascacielos: cristal,
    acero y hormigón, baldosa de gran formato y ventanales de marco fino.
  - **Mansión 8-bit** — el pixel art original, con su damero, su dorado y sus
    sprites de 8×8.

  Las dos primeras dibujan el mobiliario con **Material Symbols** de Google
  (`flatArt.jsx` + `materialSymbols.js`); la tercera, con el emisor de pixel art
  original (`pixelArt.jsx`). La zona se parte en dos capas:
  `src/game/zones.js` guarda lo que la lógica necesita —qué zona toca a cada
  semilla y **cómo se llama cada elemento** en ella— y
  `src/components/zones.js`, cómo se ve (mobiliario, tintas, muros, ventanas y
  alfombra).

  Una zona puede **renombrar** elementos: en la casa de montaña la `planta` es
  una *chimenea* y la `TV` una *cómoda*, y las pistas lo dicen así. Lo que
  **no** puede cambiar es la lógica: el conjunto de ids y sus marcas
  `blocking`/`mueble` son del puzzle, no de la ambientación. La chimenea encaja
  precisamente porque comparte clase con la planta —estorba el paso y no es
  mobiliario—, así que la pista "no estaba junto a ningún mueble" sigue siendo
  cierta a su lado. Una aserción al cargar el módulo rechaza cualquier
  sustitución que se salga de su clase o que deje sin frase a un elemento
  pisable.

- **Un suelo por tipo de habitación** (`src/components/floorMaterials.js` +
  `floorSprites.js`): la sala manda el material y la zona manda el tinte. La
  Cocina lleva damero, la Biblioteca listones, la Bodega ladrillo, la Terraza
  losa de piedra, la Galería terrazo… diez sprites reales de 16×16 px (Kenney,
  ver créditos), no patrones CSS dibujados a mano. El material se elige por
  **nombre** de sala, no por el orden en que el generador la creó, así que una
  cocina se reconoce por su suelo tanto como por su rótulo; el tinte se indexa
  igual, por coherencia.

  Cada zona toca el suelo en un único punto: un `filter` CSS (sepia cálido en
  montaña, gris casi total en el apartamento, ninguno en la mansión 8-bit, fiel
  a su pixel art a todo color) que se combina en `multiply` con el lavado de la
  habitación — así el COLOR de una sala lo sigue poniendo la zona, y el sprite
  solo aporta la textura. Se renderiza con `image-rendering: pixelated` para
  que el recorte no se difumine al escalar de 16 px a una celda de hasta
  112 px, y el tamaño del tile se ajusta a la celda para que el grano no se
  convierta en ruido cuando el tablero se comprime a 36 px en móvil.
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
  mobiliario, ventanas y la **línea de control** (cruces `×` en fila y columna de
  cada ficha colocada, en tiempo real; útil para comprobar que ningún personaje
  comparte fila ni columna con otro). Las ventanas se dibujan sobre la pared de
  la celda (no en el suelo) y son ocupables. Las alfombras pueden ocupar entre 2
  y 6 celdas formando una región rectangular.
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

- **Material Symbols** (Google) — iconos del mobiliario de las zonas «Casa de
  montaña» y «Apartamento en la ciudad». Licencia Apache 2.0; texto íntegro en
  [`LICENSES/material-symbols-Apache-2.0.txt`](LICENSES/material-symbols-Apache-2.0.txt).
  Solo se embebe el dato `d` de cada trazado (`src/components/materialSymbols.js`),
  porque la app es una PWA offline y no puede depender de una descarga en
  tiempo de ejecución.
- **Roguelike/RPG pack** (Kenney) — los 10 sprites de suelo, uno por tipo de
  habitación (`src/components/floorSprites.js`). Licencia CC0 1.0 (dominio
  público, no exige atribución); texto de cortesía en
  [`LICENSES/kenney-roguelike-rpg-pack-CC0.txt`](LICENSES/kenney-roguelike-rpg-pack-CC0.txt).
  Cada sprite es un recorte de 16×16 px del spritesheet oficial, embebido como
  PNG en base64 por el mismo motivo que los iconos: cero peticiones en tiempo
  de ejecución.
- El pixel art de la zona «Mansión 8-bit», los retratos de los personajes y la
  lupa son originales del proyecto.
