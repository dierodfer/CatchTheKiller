// Persistencia local de la partida en curso (para poder ofrecer "continuar"
// tras recargar la página). Sin dependencias de React; nunca lanza: si
// localStorage no está disponible (incógnito, cuota, storage deshabilitado)
// las funciones se degradan en silencio y la app sigue funcionando.

// v2: `revealedExtras` (contador sobre un array fijo) pasó a `revealedExtraIds`
// (ids concretos), porque la pista concedida ya no se elige por orden sino
// según el tablero. Los guardados v1 no son convertibles y se descartan.
// v3: los identificadores de dificultad cambiaron con los seis rangos
// (`facil` → `novato`, etc.). Un guardado v2 nombra un nivel que ya no existe,
// así que tampoco es reanudable y se descarta.
export const STORAGE_KEY = 'ctk:savedGame:v3'
export const STORAGE_VERSION = 3

export function saveGame({
  status,
  difficulty,
  irregular,
  seed,
  placements,
  marks,
  struckClues,
  revealedExtraIds,
}) {
  try {
    const payload = {
      version: STORAGE_VERSION,
      status,
      difficulty,
      irregular,
      seed,
      placements,
      marks,
      struckClues,
      revealedExtraIds,
      savedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Sin persistencia disponible: la partida sigue jugándose con normalidad.
  }
}

export function loadSavedGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data?.version !== STORAGE_VERSION) return null
    if (data.status !== 'playing' && data.status !== 'fail') return null
    if (typeof data.difficulty !== 'string' || typeof data.seed !== 'number') return null
    return data
  } catch {
    return null
  }
}

export function clearSavedGame() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nada que limpiar si localStorage no está disponible.
  }
}
