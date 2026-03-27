// @vitest-environment jsdom

import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from '@desktop/App.js'

describe('desktop app layout', () => {
  it('renders the desktop shell with navigation and context panel', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument()
    expect(screen.getByTestId('context-panel')).toBeInTheDocument()
    expect(screen.getByText('Focus Queue')).toBeInTheDocument()
  })

  it('switches to the control plane page from navigation', () => {
    render(<App />)

    const nav = screen.getAllByRole('navigation', { name: 'FoxPilot 主导航' })[0]
    const controlPlaneButton = within(nav).getAllByRole('button')[5]
    fireEvent.click(controlPlaneButton)

    expect(screen.getByRole('heading', { name: 'Control Plane', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Platforms')).toBeInTheDocument()
    expect(screen.getByText('Skills')).toBeInTheDocument()
    expect(screen.getByText('MCP')).toBeInTheDocument()
  })
})
