// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AppLayout } from '@/ui/app/layout.js'

describe('desktop app layout', () => {
  it('renders the desktop shell with navigation and context panel', () => {
    render(<AppLayout />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('context-panel')).toBeInTheDocument()
  })
})
