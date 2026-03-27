import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: [
      { find: '@contracts', replacement: fileURLToPath(new URL('./packages/contracts/src', import.meta.url)) },
      { find: '@runtime', replacement: fileURLToPath(new URL('./packages/runtime/src', import.meta.url)) },
      {
        find: '@control-plane',
        replacement: fileURLToPath(new URL('./packages/runtime/src/read-models', import.meta.url)),
      },
      { find: '@infra', replacement: fileURLToPath(new URL('./packages/infra/src', import.meta.url)) },
      {
        find: '@integrations',
        replacement: fileURLToPath(new URL('./packages/integrations/src', import.meta.url)),
      },
      { find: '@desktop', replacement: fileURLToPath(new URL('./apps/desktop/src', import.meta.url)) },
      { find: '@tests', replacement: fileURLToPath(new URL('./tests', import.meta.url)) },
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
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
