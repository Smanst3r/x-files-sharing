import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from "@/contexts/use-theme.tsx";
import { AuthProvider } from "@/auth-context.tsx";
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>
            <AuthProvider>
                <App/>
            </AuthProvider>
        </ThemeProvider>
    </StrictMode>,
)
