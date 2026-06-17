<p align="center">
  <img src="public/icon-512.png" width="120" alt="Catch the Killer" />
</p>

# Catch the Killer

🔗 **Demo en GitHub Pages:** https://dierodfer.github.io/CatchTheKiller/

Puzzle de deducción espacial con temática de crimen. El jugador reconstruye la
escena colocando a cada personaje en un mapa cuadriculado (con filas y columnas
numeradas) a partir de pistas espaciales. **El asesino emerge automáticamente**
como consecuencia de una reconstrucción correcta del tablero: es el único
sospechoso que se queda **a solas con la víctima en una misma habitación**;
además, **ningún personaje comparte fila ni columna con otro**: cada uno ocupa
una fila y una columna propias. La víctima es siempre el personaje cuyo nombre
empieza por la letra alfabéticamente más alta de todos los presentes.

> Implementación **100% local**: la generación del mapa, la solución, las pistas
> y el Solver son lógica interna en JavaScript puro. No se llama a ninguna IA ni
> servicio externo.

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

- **Dos ambientaciones** (`src/components/zones.js`): cada caso se sitúa en un
  **Apartamento en la ciudad** (frío-neutro, veteado de lino/mármol mediante
  ruido SVG) o una **Casa de montaña** (cálido-terroso, veta de madera también
  con ruido SVG direccional). La zona se deriva de la semilla del puzzle, así
  que es **puramente visual**: no altera el mapa, las pistas ni la regla del
  asesino, solo la atmósfera (acento, textura y distintivo). Son distinguibles
  a golpe de vista pero cohesivas en el sistema.
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
  usadas. Ninguna pista referencia a la víctima.
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

Cuestiones aún abiertas del diseño (sección 15): revelado progresivo de pistas,
sistema de puntuación, multijugador y persistencia entre sesiones.
