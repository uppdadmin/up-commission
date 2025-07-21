import ReactDOM from 'react-dom/client'
import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router'
import { ClerkProvider } from '@clerk/react-router'
import './index.css'
import App from './App'
import { ptBR } from '@clerk/localizations'
// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
    throw new Error('Add your Clerk Publishable Key to the .env file')
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <ClerkProvider localization={ptBR} publishableKey={PUBLISHABLE_KEY}>
                <App />
            </ClerkProvider>
        </BrowserRouter>
    </StrictMode>,
)