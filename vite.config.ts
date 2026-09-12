import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { jsonManagerApi } from './server/plugin'

export default defineConfig({
  plugins: [react(), jsonManagerApi()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
