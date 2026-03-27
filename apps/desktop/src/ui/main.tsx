import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AppRouter } from '@desktop/ui/app/router.js'
import '@desktop/ui/styles.css'

const container = document.getElementById('root')

if (container) {
  createRoot(container).render(
    <StrictMode>
      <AppRouter />
    </StrictMode>,
  )
}
