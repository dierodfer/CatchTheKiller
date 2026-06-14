// PRNG determinista (mulberry32) para poder reproducir puzzles con una semilla.

export function makeRng(seed) {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomSeed() {
  return Math.floor(Math.random() * 0xffffffff)
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
