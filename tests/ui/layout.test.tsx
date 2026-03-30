// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { App } from '@desktop/App.js'

describe('desktop app layout', () => {
  beforeEach(() => {
    cleanup()
    window.localStorage.clear()
    window.localStorage.setItem('foxpilot.desktop.language', 'en-US')
    window.localStorage.setItem('foxpilot.desktop.theme', 'dark')
    window.location.hash = ''
  })

  it('renders the desktop shell with sidebar navigation and settings entry', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Focus Queue')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('switches to the control plane page from navigation', () => {
    render(<App />)

    const nav = screen.getByRole('navigation', { name: 'FoxPilot main navigation' })
    const controlPlaneItem = within(nav).getByRole('menuitem', { name: /Control Plane/i })
    fireEvent.click(controlPlaneItem)

    expect(screen.getByRole('heading', { name: 'Control Plane', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Platforms')).toBeInTheDocument()
    expect(screen.getByText('Skills')).toBeInTheDocument()
    expect(screen.getByText('MCP')).toBeInTheDocument()
  })

  it('updates language and theme preferences from desktop controls', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    fireEvent.click(screen.getByRole('button', { name: 'Language Resolved language: en-US' }))
    fireEvent.click(screen.getByRole('button', { name: '中文' }))

    fireEvent.click(screen.getByRole('button', { name: '设置' }))
    fireEvent.click(screen.getByRole('button', { name: '主题 当前主题: dark' }))
    fireEvent.click(screen.getByRole('button', { name: '浅色' }))

    expect(screen.getByRole('navigation', { name: 'FoxPilot 主导航' })).toBeInTheDocument()
    await waitFor(() => {
      expect(document.documentElement.lang).toBe('zh-CN')
      expect(document.documentElement.dataset.theme).toBe('light')
    })
  })
})
