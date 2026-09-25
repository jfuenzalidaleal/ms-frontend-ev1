import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance, initializeMsal } from './msalInstance'

initializeMsal().then(() => {
    createRoot(document.getElementById('root')).render(
        <StrictMode>
            <MsalProvider instance={msalInstance}>
                <BrowserRouter> {/* <--- IMPORTANTE: Envolver App aquí */}
                    <App />
                </BrowserRouter>
            </MsalProvider>
        </StrictMode>,
    )
})