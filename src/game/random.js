// PRNG determinista (mulberry32) para poder reproducir puzzles con una semilla.

export function makeRng(seed) {
  let a = seed >>> 0
  return function rng() {
    // Los `| 0` son coerción a int32 con desbordamiento (parte del algoritmo
    // mulberry32): NO son truncados. Sustituirlos por Math.trunc cambiaría la
    // secuencia y rompería la reproducibilidad de los códigos compartidos.
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Semilla inicial de un caso nuevo. Se toma del CSPRNG de la plataforma para
// no depender de la calidad (ni del sesgo) de Math.random.
export function randomSeed() {
  const buf = new Uint32Array(1)
  globalThis.crypto.getRandomValues(buf)
  return buf[0]
}

export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1))
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

export function shuffle(rng, arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Elección aleatoria ponderada: cada elemento se escoge con probabilidad
// proporcional a `weightOf(item)`. Si todos los pesos son 0 (o el array es de
// pesos no positivos), cae a una elección uniforme.
export function weightedPick(rng, items, weightOf) {
  let total = 0
  for (const it of items) total += Math.max(0, weightOf(it))
  if (total <= 0) return pick(rng, items)
  let t = rng() * total
  for (const it of items) {
    t -= Math.max(0, weightOf(it))
    if (t < 0) return it
  }
  return items[items.length - 1]
}
