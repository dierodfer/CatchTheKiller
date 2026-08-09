// Configuración de Vitest, separada de `vite.config.js` a propósito: la de
// build arrastra el plugin de PWA (genera service worker y manifest), que no
// pinta nada en los tests y solo los haría más lentos y ruidosos.

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // `jsdom` solo donde hace falta: los tests de `src/game/` son JS puro y
    // corren en el entorno `node`, que es bastante más rápido. Cada fichero
    // que necesite DOM lo declara con `// @vitest-environment jsdom`.
    environment: 'node',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      // Sprites y tiles: son data URI en base64, no hay lógica que cubrir.
      exclude: ['src/**/*.test.{js,jsx}', 'src/test/**', 'src/**/*Sprites.js', 'src/**/rugTextures.js'],
    },
  },
})
