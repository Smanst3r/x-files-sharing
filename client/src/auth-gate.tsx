import { FormEvent, ReactNode, useEffect, useState } from 'react';
import api from "@/lib/axios.ts";
import { AxiosError } from "axios";
import useCommonStyles from "@/styles.tsx";

export function AuthGate({ children }: { children: ReactNode }) {
    const [isInitialCheckup, setIsInitialCheckup] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [errorStatus, setErrorStatus] = useState<number|undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const commonClasses = useCommonStyles();

    useEffect(() => {
        api.get('/').then(() => {
            setAuthenticated(true);
        }).catch((reason: AxiosError) => {
            setAuthenticated(false);
            setErrorStatus(reason.status);
            setError((reason.response?.data as string) || reason.message);
        }).finally(() => {
            setIsInitialCheckup(false);
        });
    }, []);

    const submitToken = async (event: FormEvent) => {
        event.preventDefault();
        setErrorStatus(undefined);
        setError('');
        setIsSubmitting(true);
        api.post('/auth', {
            token: token,
        }).then(() => {
            setAuthenticated(true);
            window.location.reload();
        }).catch((reason: AxiosError) => {
            setError((reason.response?.data as string) || reason.message);
            setErrorStatus(reason.status);
        }).finally(() => { setIsSubmitting(false) });
    };

    if (isInitialCheckup) {
        return <h1 style={{ textAlign: 'center' }}>Checking auth...</h1>;
    }

    if (!authenticated) {
        // Do not show token form if maximum attempts exceed
        if (errorStatus && errorStatus === 429) {
            return <div style={{ textAlign: 'center' }}>
                <h1 className={commonClasses.textDanger}>Exceed max attempts</h1>
                <p>{error}</p>
            </div>
        }

        if (errorStatus && errorStatus !== 401) {
            return <div style={{ textAlign: 'center' }}>
                <h1 className={commonClasses.textDanger}>Unknown server error</h1>
                <p>{error}</p>
            </div>
        }

        return (
            <form onSubmit={submitToken} style={{ maxWidth: 400, margin: '3rem auto' }} action={`${api.defaults.baseURL}/auth`}>
                <h2>Enter Access Token</h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    disabled={isSubmitting}
                    placeholder="Token"
                    style={{ width: '100%', padding: '10px', marginBottom: '1rem' }}
                />
                <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px' }}>Submit</button>
            </form>
        );
    }

    return <>{children}</>;
}
