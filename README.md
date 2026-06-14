# Catch the Killer

Puzzle de deducción espacial con temática de crimen. El jugador reconstruye la
escena colocando a cada personaje en un mapa cuadriculado a partir de pistas
espaciales. **El asesino emerge automáticamente** como consecuencia de una
reconstrucción correcta del tablero (regla tipo torre de ajedrez: controla toda
su fila y su columna, con la víctima en su línea y ningún otro personaje en
ella).

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

## Cómo ejecutar

```bash
npm install
npm run dev        # desarrollo (http://localhost:5173)
npm run build      # build de producción en dist/
npm run preview    # sirve el build
npm run test:logic # smoke test de la lógica de generación (sin UI)
```

## Arquitectura

La lógica del juego vive en `src/game/` y es independiente de la UI:

```
src/game/
  constants.js          Mobiliario, dificultades, habitaciones
  random.js             PRNG determinista (semilla reproducible)
  mapGenerator.js       Cuadrícula + habitaciones irregulares + mobiliario + ventanas
  solutionGenerator.js  Coloca personajes garantizando exactamente 1 asesino
  killerRule.js         Regla del asesino (fila + columna, mobiliario no corta)
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

- `Board` / `Cell` — cuadrícula con habitaciones, mobiliario, ventanas y la
  **línea de control** (cruces `×` en fila y columna de cada ficha colocada, en
  tiempo real).
- `CharacterTray` — fichas sin colocar; zona para descolocar.
- `CluePanel` — pistas por sospechoso, marcables como usadas.
- `Toolbar` — Resolver, Ayuda progresiva (penaliza), Nuevo.
- `ResultBanner` — WIN revela al asesino, la víctima y la línea de control;
  FAIL indica que hay errores **sin revelar la solución**.

Colocación por **arrastre** (dnd-kit) o **click-to-place** (seleccionar ficha y
pulsar la celda).

## Estado del proyecto

Primer hito jugable de extremo a extremo para las tres dificultades
(4×4 / 5×5 / 6×6). La capa de generación es local; si en el futuro se quiere
delegar la generación de solución/pistas a un modelo, basta con sustituir
`solutionGenerator` + `clueGenerator` respetando el contrato de datos
(sección 10 del diseño), manteniendo el Solver como autoridad final.

Cuestiones aún abiertas del diseño (sección 15): revelado progresivo de pistas,
sistema de puntuación, multijugador y persistencia entre sesiones.
