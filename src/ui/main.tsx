import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AppRouter } from '@/ui/app/router.js'

const container = document.getElementById('root')

if (container) {
  createRoot(container).render(
    <StrictMode>
      <AppRouter />
    </StrictMode>,
  )
}
