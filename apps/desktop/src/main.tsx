import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@desktop/App.js'
import 'antd/dist/reset.css'
import '@desktop/styles.css'

const container = document.getElementById('root')

if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
