import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
// Eager import: themeStore runs loadFromStorage at module init,
// applying the persisted theme before first paint.
import '@/stores/themeStore'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
