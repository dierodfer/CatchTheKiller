// Setup común de Vitest. Se carga en TODOS los ficheros de test, también en
// los que corren en `node`, así que aquí no puede haber nada que dé por hecho
// que existe un DOM.

import { afterEach, expect } from 'vitest'

// Los matchers de jest-dom (`toBeInTheDocument`, `toHaveStyle`…) y el desmontado
// automático entre tests necesitan `document`; en los tests de `src/game/` no
// lo hay, así que ambos se registran solo cuando el entorno es jsdom.
//
// El `cleanup` no es opcional: Testing Library solo lo engancha sola cuando
// `globals: true`, y sin él cada `render` deja su árbol en el documento —
// las consultas empiezan a encontrar elementos de tests anteriores y los
// fallos que salen no tienen nada que ver con lo que se está probando.
if (typeof document !== 'undefined') {
  const matchers = await import('@testing-library/jest-dom/matchers')
  expect.extend(matchers.default ?? matchers)

  const { cleanup } = await import('@testing-library/react')
  afterEach(cleanup)
}
