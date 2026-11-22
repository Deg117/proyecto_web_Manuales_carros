
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import App from './AutoLibrary.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
)
