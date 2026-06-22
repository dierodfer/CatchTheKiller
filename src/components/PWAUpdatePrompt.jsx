import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-amber-300/40 bg-stone-800/95 px-5 py-3 shadow-lg backdrop-blur">
      <p className="font-sans text-sm text-amber-50">
        Hay una nueva versión disponible.
      </p>
      <button
        onClick={() => updateServiceWorker(true)}
        className="rounded bg-amber-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-amber-500"
      >
        Actualizar
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="rounded px-3 py-1 text-xs text-amber-200/70 transition-colors hover:text-amber-100"
      >
        Más tarde
      </button>
    </div>
  )
}
