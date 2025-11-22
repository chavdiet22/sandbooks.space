import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import '@fontsource-variable/jetbrains-mono'
import './index.css'
import './highlightjs-theme.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster position="top-right" />
    </ErrorBoundary>
  </StrictMode>,
)
