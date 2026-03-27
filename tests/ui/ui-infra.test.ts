import { describe, expect, it } from 'vitest'

describe('ui infrastructure', () => {
  it('exposes the ui build stack and jsdom test environment', async () => {
    const packageJson = await import('../../package.json', { with: { type: 'json' } })
    const pkg = packageJson.default

    expect(pkg.dependencies.react).toBeDefined()
    expect(pkg.dependencies['react-dom']).toBeDefined()
    expect(pkg.devDependencies.vite).toBeDefined()
    expect(pkg.devDependencies.jsdom).toBeDefined()
    expect(pkg.devDependencies['@testing-library/react']).toBeDefined()
    expect(pkg.dependencies['@radix-ui/react-dialog']).toBeDefined()
  })
})
