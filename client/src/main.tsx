import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from "@/contexts/use-theme.tsx";
import { AuthGate } from "@/auth-gate.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>
            <AuthGate>
                <App/>
            </AuthGate>
        </ThemeProvider>
    </StrictMode>,
)
