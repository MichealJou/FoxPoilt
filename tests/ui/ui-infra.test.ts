import { describe, expect, it } from 'vitest'

describe('ui infrastructure', () => {
  it('exposes the ui build stack and jsdom test environment', async () => {
    const rootPackageJson = await import('../../package.json', { with: { type: 'json' } })
    const desktopPackageJson = await import('../../apps/desktop/package.json', { with: { type: 'json' } })
    const rootPkg = rootPackageJson.default
    const desktopPkg = desktopPackageJson.default

    expect(rootPkg.private).toBe(true)
    expect(rootPkg.devDependencies.vitest).toBeDefined()
    expect(rootPkg.devDependencies.jsdom).toBeDefined()
    expect(rootPkg.devDependencies['@testing-library/react']).toBeDefined()

    expect(desktopPkg.dependencies.react).toBeDefined()
    expect(desktopPkg.dependencies['react-dom']).toBeDefined()
    expect(desktopPkg.dependencies['lucide-react']).toBeDefined()
    expect(desktopPkg.devDependencies.vite).toBeDefined()
    expect(desktopPkg.devDependencies['@tailwindcss/vite']).toBeDefined()
    expect(desktopPkg.devDependencies.tailwindcss).toBeDefined()
    expect(desktopPkg.devDependencies['@tauri-apps/cli']).toBeDefined()
  })
})
