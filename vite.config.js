import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Needed for client-side routing — serves index.html for all routes
  server: {
    historyApiFallback: true,
  },
})
