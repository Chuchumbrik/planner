import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@/i18n'
import { AuthProvider } from '@/auth/AuthProvider'
import { DefectReportProvider } from '@/defect/DefectReportProvider'
import { VaultProvider } from '@/vault/VaultProvider'
import { initPwaServiceWorker } from '@/lib/pwaServiceWorker'
import './index.css'
import { App } from './App'

initPwaServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DefectReportProvider>
          <VaultProvider>
            <App />
          </VaultProvider>
        </DefectReportProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
