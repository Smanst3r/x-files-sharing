import { FormEvent, ReactNode, useEffect, useState } from 'react';
import api from "@/lib/axios.ts";
import { AxiosError } from "axios";

export function AuthGate({ children }: { children: ReactNode }) {
    const [checking, setChecking] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [token, setToken] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/').then(() => {
            setAuthenticated(true);
        }).catch((reason: AxiosError) => {
            setAuthenticated(false);
            if (reason.status !== 401) {
                // TODO: log error
            }
        }).finally(() => {
            setChecking(false);
        });
    }, []);

    const submitToken = async (event: FormEvent) => {
        event.preventDefault();
        api.post('/auth', {
            token: token,
        }).then(() => {
            window.location.reload();
        }).catch((reason: AxiosError) => {
            setError((reason.response?.data as string) || reason.message);
        });
    };

    if (checking) {
        return <p>Checking auth...</p>;
    }

    if (!authenticated) {
        return (
            <form onSubmit={submitToken} style={{ maxWidth: 400, margin: '3rem auto' }} action={`${api.defaults.baseURL}/auth`}>
                <h2>Enter Access Token</h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    placeholder="Token"
                    style={{ width: '100%', padding: '10px', marginBottom: '1rem' }}
                />
                <button type="submit" style={{ padding: '10px 20px' }}>Submit</button>
            </form>
        );
    }

    return <>{children}</>;
}
