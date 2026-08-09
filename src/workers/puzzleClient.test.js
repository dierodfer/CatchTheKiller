// Cliente del worker de generación. Lo que se prueba aquí no es que llegue un
// puzzle —eso ya lo cubre `scripts/testLogic.mjs` sobre la función pura— sino
// las reglas de CORRELACIÓN y CANCELACIÓN, que son la parte que puede dejar la
// pantalla colgada o pintar el caso equivocado.
//
// El Worker se inyecta falso a propósito: jsdom no implementa `Worker`, y un
// worker real convertiría cada test en una espera de cientos de ms.

import { describe, it, expect, vi } from 'vitest'
import { createPuzzleRunner, PuzzleRequestSuperseded } from './puzzleClient.js'

class FakeWorker {
  constructor() {
    this.posted = []
    this.terminated = false
  }
  postMessage(msg) {
    this.posted.push(msg)
  }
  terminate() {
    this.terminated = true
  }
  reply(msg) {
    this.onmessage?.({ data: msg })
  }
  // Último mensaje recibido, para responder con su mismo id sin adivinarlo.
  get lastId() {
    return this.posted.at(-1).id
  }
}

// Devuelve el runner y los workers que ha ido creando, en orden.
function setup() {
  const workers = []
  const runner = createPuzzleRunner({
    createWorker: () => {
      const w = new FakeWorker()
      workers.push(w)
      return w
    },
  })
  return { runner, workers }
}

const request = { difficultyId: 'facil', seed: 7, irregular: true }

describe('petición y respuesta', () => {
  it('envía la petición con la dificultad, la semilla y el modo irregular', async () => {
    const { runner, workers } = setup()
    const promise = runner.generate(request)
    expect(workers[0].posted).toHaveLength(1)
    expect(workers[0].posted[0]).toMatchObject(request)

    workers[0].reply({ type: 'result', id: workers[0].lastId, puzzle: { seed: 7 } })
    await expect(promise).resolves.toEqual({ seed: 7 })
  })

  it('propaga el mensaje de error del generador tal cual', async () => {
    // El texto se muestra al jugador en la pantalla de inicio: si el cliente lo
    // sustituyera por uno genérico, "Dificultad desconocida: x" se perdería.
    const { runner, workers } = setup()
    const promise = runner.generate(request)
    workers[0].reply({ type: 'error', id: workers[0].lastId, message: 'Semilla imposible' })
    await expect(promise).rejects.toThrow('Semilla imposible')
  })

  it('un error sin mensaje cae en el texto genérico', async () => {
    const { runner, workers } = setup()
    const promise = runner.generate(request)
    workers[0].reply({ type: 'error', id: workers[0].lastId })
    await expect(promise).rejects.toThrow('No se pudo generar el caso')
  })

  it('reutiliza el mismo worker entre peticiones consecutivas', async () => {
    const { runner, workers } = setup()
    const first = runner.generate(request)
    workers[0].reply({ type: 'result', id: workers[0].lastId, puzzle: { seed: 1 } })
    await first

    const second = runner.generate(request)
    workers[0].reply({ type: 'result', id: workers[0].lastId, puzzle: { seed: 2 } })
    await expect(second).resolves.toEqual({ seed: 2 })
    // Arrancar un worker cuesta parsear su chunk: no se paga en cada partida.
    expect(workers).toHaveLength(1)
  })
})

describe('respuestas obsoletas', () => {
  it('ignora una respuesta con un id que no es el de la petición en curso', async () => {
    const { runner, workers } = setup()
    const promise = runner.generate(request)
    const settled = vi.fn()
    promise.then(settled, settled)

    workers[0].reply({ type: 'result', id: 999, puzzle: { seed: 'viejo' } })
    await Promise.resolve()
    // Sin este descarte, un puzzle de una partida anterior podría pisar el
    // tablero recién generado.
    expect(settled).not.toHaveBeenCalled()

    workers[0].reply({ type: 'result', id: workers[0].lastId, puzzle: { seed: 'nuevo' } })
    await expect(promise).resolves.toEqual({ seed: 'nuevo' })
  })
})

describe('cancelación: gana la última petición', () => {
  it('reemplaza la petición en vuelo, mata su worker y levanta otro', async () => {
    const { runner, workers } = setup()
    const first = runner.generate(request)
    const second = runner.generate({ ...request, seed: 99 })

    // `terminate()` es la única cancelación real: dentro del bucle síncrono el
    // worker no puede atender un mensaje de aborto.
    await expect(first).rejects.toBeInstanceOf(PuzzleRequestSuperseded)
    expect(workers[0].terminated).toBe(true)
    expect(workers).toHaveLength(2)
    expect(workers[1].posted[0]).toMatchObject({ seed: 99 })

    workers[1].reply({ type: 'result', id: workers[1].lastId, puzzle: { seed: 99 } })
    await expect(second).resolves.toEqual({ seed: 99 })
  })

  it('no reemplaza nada si no hay ninguna petición en vuelo', async () => {
    const { runner, workers } = setup()
    const first = runner.generate(request)
    workers[0].reply({ type: 'result', id: workers[0].lastId, puzzle: {} })
    await first

    runner.generate(request)
    expect(workers[0].terminated).toBe(false)
  })
})

describe('fallos del worker en sí', () => {
  it('un error de carga rechaza la petición y descarta el worker', async () => {
    const { runner, workers } = setup()
    const promise = runner.generate(request)
    workers[0].onerror({ message: 'Failed to load module script' })
    await expect(promise).rejects.toThrow('Failed to load module script')

    // El worker pudo quedar inservible (p. ej. el módulo ni llegó a cargar):
    // la siguiente petición estrena uno.
    runner.generate(request)
    expect(workers).toHaveLength(2)
  })

  it('un mensaje no clonable rechaza con el texto genérico', async () => {
    const { runner, workers } = setup()
    const promise = runner.generate(request)
    workers[0].onmessageerror()
    await expect(promise).rejects.toThrow('No se pudo generar el caso')
  })
})

describe('dispose', () => {
  it('termina el worker y deja el runner utilizable', async () => {
    const { runner, workers } = setup()
    const first = runner.generate(request)
    workers[0].reply({ type: 'result', id: workers[0].lastId, puzzle: {} })
    await first

    runner.dispose()
    expect(workers[0].terminated).toBe(true)

    const second = runner.generate(request)
    workers[1].reply({ type: 'result', id: workers[1].lastId, puzzle: { seed: 3 } })
    await expect(second).resolves.toEqual({ seed: 3 })
  })

  it('sin worker creado no falla', () => {
    const { runner, workers } = setup()
    expect(() => runner.dispose()).not.toThrow()
    expect(workers).toHaveLength(0)
  })

  it('isBusy distingue una generación en vuelo de una ya resuelta', async () => {
    const { runner, workers } = setup()
    expect(runner.isBusy()).toBe(false)

    const promise = runner.generate(request)
    // De esto depende que StrictMode no mate en el desmontaje simulado una
    // generación que el remontaje sigue esperando (ver useGame.js).
    expect(runner.isBusy()).toBe(true)

    workers[0].reply({ type: 'result', id: workers[0].lastId, puzzle: {} })
    await promise
    expect(runner.isBusy()).toBe(false)
  })
})
