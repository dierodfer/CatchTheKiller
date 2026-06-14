import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Base relativo: permite servir el build desde un subdirectorio
  // (p. ej. https://usuario.github.io/CatchTheKiller/) sin fijar el nombre del repo.
  base: './',
})
