import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@desktop': fileURLToPath(new URL('./apps/desktop/src', import.meta.url)),
      '@tests': fileURLToPath(new URL('./tests', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/ui/**/*.test.ts', 'jsdom'],
      ['tests/ui/**/*.test.tsx', 'jsdom'],
    ],
    setupFiles: ['tests/ui/setup.ts'],
  },
})
