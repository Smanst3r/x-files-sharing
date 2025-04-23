import { createContext, useContext, useEffect, useState, ReactNode, FormEvent } from 'react';
import api from '@/lib/axios.ts';
import { AxiosError } from 'axios';
import useCommonStyles from "@/styles.tsx";
import { Button, Field, Input, makeStyles, tokens } from "@fluentui/react-components";
import { ArrowEnterRegular } from "@fluentui/react-icons";

type AuthType = 'ip' | 'token' | null;

interface AuthContextValue {
    authenticatedBy: AuthType;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const useStyles = makeStyles({
    form: {
        maxWidth: '460px',
        margin: '3rem auto',
        padding: '2rem',
        border: `2px solid ${tokens.colorBrandBackground}`,
        borderRadius: tokens.borderRadiusLarge,
    }
});

export const AuthProvider = ({children}: { children: ReactNode }) => {
    const commonClasses = useCommonStyles();
    const classes = useStyles();
    const [error, setError] = useState('');
    const [errorStatus, setErrorStatus] = useState<number | undefined>();

    const [authenticatedBy, setAuthenticatedBy] = useState<AuthType>(null);
    const [token, setToken] = useState('');
    const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
    const [isCheckingToken, setIsCheckingToken] = useState<boolean>(false);

    useEffect(() => {
        api.get('/')
            .then((res) => {
                setAuthenticatedBy(res.data.authenticatedBy);
            })
            .catch((reason: AxiosError) => {
                setAuthenticatedBy(null);
                if (reason.status !== 401) {
                    setErrorStatus(reason.status);
                    setError((reason.response?.data as string) || reason.message);
                }
            })
            .finally(() => setIsInitialLoading(false));
    }, []);

    const submitToken = async (event: FormEvent) => {
        event.preventDefault();
        setErrorStatus(undefined);
        setError('');
        setIsCheckingToken(true);
        api.post('/auth', {
            token: token,
        }).then(() => {
            setAuthenticatedBy('token')
            // window.location.reload();
        }).catch((reason: AxiosError) => {
            setError((reason.response?.data as string) || reason.message);
            setErrorStatus(reason.status);
        }).finally(() => {
            setIsCheckingToken(false)
        });
    };

    if (isInitialLoading) {
        return <h1 style={{textAlign: 'center'}}>Loading, please wait...</h1>;
    }

    if (!authenticatedBy) {
        // Do not show token form if maximum attempts exceed
        if (errorStatus && errorStatus === 429) {
            return <div style={{textAlign: 'center'}}>
                <h1 className={commonClasses.textDanger}>Exceed max attempts</h1>
                <p>{error}</p>
            </div>
        }

        if (errorStatus && errorStatus !== 401) {
            return <div style={{textAlign: 'center'}}>
                <h1 className={commonClasses.textDanger}>Unknown server error</h1>
                <p>{error}</p>
            </div>
        }

        return (
            <form onSubmit={submitToken} className={classes.form} action={`${api.defaults.baseURL}/auth`}>
                <h2>Enter Access Token</h2>
                <Field label="" size="large"
                       validationState={error ? 'error' : 'none'}
                       validationMessage={error ? error : ''}>
                    <Input type="text"
                           required
                           placeholder="Token"
                           value={token}
                           disabled={isCheckingToken}
                           onChange={(e) => setToken(e.target.value)}/>
                </Field>
                <Button type="submit"
                        appearance="primary"
                        icon={<ArrowEnterRegular/>}
                        size="large"
                        disabled={isCheckingToken}
                        style={{marginTop: '1rem'}}>
                    Submit
                </Button>
            </form>
        );
    }

    return (
        <AuthContext.Provider value={{authenticatedBy}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
