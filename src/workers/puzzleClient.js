// Cliente del worker de generación (lado hilo principal): encapsula creación,
// correlación petición/respuesta y cancelación, para que `useGame` solo vea una
// promesa.
//
// `createWorker` es inyectable porque los tests no pueden crear un Worker de
// verdad: jsdom no lo implementa.

const MENSAJE_ERROR_GENERICO = 'No se pudo generar el caso'

// No es un fallo que mostrar, es "esta petición ya no manda": quien la lanzó no
// debe tocar el estado, porque la petición que la reemplazó lo hará.
export class PuzzleRequestSuperseded extends Error {
  constructor() {
    super('Petición de generación reemplazada')
    this.name = 'PuzzleRequestSuperseded'
  }
}

function spawnWorker() {
  // `new URL(..., import.meta.url)` y no una ruta literal: así Vite emite el
  // chunk y reescribe la URL contra `base` (/CatchTheKiller/ en producción).
  return new Worker(new URL('./puzzleWorker.js', import.meta.url), {
    type: 'module',
    name: 'puzzle-generator',
  })
}

export function createPuzzleRunner({ createWorker = spawnWorker } = {}) {
  let worker = null
  let pending = null // { id, resolve, reject }
  let nextId = 0

  // Fallo del worker en sí (no del generador): puede haber quedado en un estado
  // inconsistente, así que se descarta y la siguiente petición levanta otro.
  const failAndDiscardWorker = (message) => {
    worker?.terminate()
    worker = null
    if (!pending) return
    const { reject } = pending
    pending = null
    reject(new Error(message || MENSAJE_ERROR_GENERICO))
  }

  const attach = (w) => {
    w.onmessage = (event) => {
      const msg = event.data
      // Respuesta de una petición ya reemplazada: se descarta sin tocar nada.
      if (!pending || !msg || msg.id !== pending.id) return
      const { resolve, reject } = pending
      pending = null
      if (msg.type === 'result') resolve(msg.puzzle)
      else reject(new Error(msg.message || MENSAJE_ERROR_GENERICO))
    }
    w.onerror = (event) => {
      event?.preventDefault?.()
      failAndDiscardWorker(event?.message)
    }
    w.onmessageerror = () => failAndDiscardWorker()
    return w
  }

  // `terminate()` es la única cancelación posible: dentro del bucle síncrono el
  // worker no puede atender un mensaje de aborto, así que un protocolo de
  // cancelación por mensajes no llegaría hasta después de terminar el trabajo.
  const supersede = () => {
    if (!pending) return
    worker?.terminate()
    worker = null
    const { reject } = pending
    pending = null
    reject(new PuzzleRequestSuperseded())
  }

  return {
    generate({ difficultyId, seed, irregular }) {
      supersede()
      worker ??= attach(createWorker())
      const id = ++nextId
      return new Promise((resolve, reject) => {
        pending = { id, resolve, reject }
        worker.postMessage({ type: 'generate', id, difficultyId, seed, irregular })
      })
    },
    isBusy: () => pending !== null,
    // Idempotente y no destructivo: el runner sigue usable después, la
    // siguiente llamada a `generate` levanta un worker nuevo.
    dispose() {
      supersede()
      worker?.terminate()
      worker = null
    },
  }
}
