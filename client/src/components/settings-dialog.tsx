import { ChangeEvent, FC, useEffect, useRef, useState } from "react";
import {
    Dialog,
    DialogTrigger,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogActions,
    DialogContent,
    Button, Label, Textarea, makeStyles, Field, ProgressBar, MessageBar, MessageBarBody, MessageBarTitle,
} from "@fluentui/react-components";
import { SettingsRegular } from '@fluentui/react-icons';
import api from "@/lib/axios.ts";
import useCommonStyles from "@/styles.tsx";

type TSettingsDialogContentProps = {
    allowedIpAddresses: string[];
    accessTokens: string[];
    onChangeIpAddressesTextarea: (event: ChangeEvent<HTMLTextAreaElement>) => void
    onChangeAccessTokensTextarea: (event: ChangeEvent<HTMLTextAreaElement>) => void
}

const useStyles = makeStyles({
    label: {
        display: 'block',
        fontWeight: 'bold',
    },
    textarea: {
        width: '100%',
        overflow: 'hidden',
    },
});

export const SettingsDialog: FC = () => {
    const commonClasses = useCommonStyles();
    const [open, setOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [allowedIpAddresses, setAllowedIpAddresses] = useState<string[]>([]);
    const [accessTokens, setAccessTokens] = useState<string[]>([]);

    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isSaved, setIsSaved] = useState<boolean>(false);

    const onChangeIpAddressesTextarea = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setAllowedIpAddresses(event.target.value.split('\n'))
    }

    const onChangeAccessTokensTextarea = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setAccessTokens(event.target.value.split('\n'));
    }

    useEffect(() => {
        let timeout: null|NodeJS.Timeout = null;
        if (isSaved) {
            timeout = setTimeout(() => {
                setIsSaved(false);
            }, 1500);
        }

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        }
    }, [isSaved]);

    const handleSave = async () => {
        setIsSaving(true);
        setIsSaved(false);
        try {
            await api.post(`/website-settings`, {
                allowed_ip_addresses: allowedIpAddresses,
                access_tokens: accessTokens,
            });
            // setOpen(false);
            setIsSaved(true);
        } catch (error: any) {
            setError((error.response?.data as string) || error.message);
        } finally {
            setIsSaving(false);
        }
    }

    useEffect(() => {
        if (open) {
            setIsLoading(true);
            setError('');
            api.get(`/website-settings`)
                .then((response) => {
                    setAllowedIpAddresses(response.data?.allowed_ip_addresses ?? []);
                    setAccessTokens(response.data?.access_tokens ?? []);
                })
                .catch((reason) => {
                    setError(reason.toString());
                })
                .finally(() => setIsLoading(false));
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
            <DialogTrigger disableButtonEnhancement>
                <Button icon={<SettingsRegular />}>IP Whitelist & Access Tokens</Button>
            </DialogTrigger>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>
                        IP Whitelist & Access Tokens
                    </DialogTitle>
                    <DialogContent>
                        <div style={{ marginBottom: '10px' }}>
                            Put client IP address or share one of available access tokens.
                            <br/>Use new line as delimiter
                        </div>
                        {isLoading
                            ? <div>Loading...</div>
                            : error
                                ? <div className={commonClasses.textDanger}>Error: {error}</div>
                                : <SettingsDialogContent allowedIpAddresses={allowedIpAddresses}
                                                         accessTokens={accessTokens}
                                                         onChangeAccessTokensTextarea={onChangeAccessTokensTextarea}
                                                         onChangeIpAddressesTextarea={onChangeIpAddressesTextarea} />
                        }
                        {isSaving && <Field validationMessage="Saving" validationState="none" style={{ marginTop: '0.5rem' }}>
                            <ProgressBar />
                        </Field>}
                        {isSaved && <MessageBar intent="success" style={{ marginTop: '0.5rem' }}>
                            <MessageBarBody>
                                <MessageBarTitle>OK</MessageBarTitle>
                                Settings were saved successfully
                            </MessageBarBody>
                        </MessageBar>}
                    </DialogContent>
                    <DialogActions>
                        <Button type="button" appearance="primary" onClick={handleSave} disabled={isSaving}>Save</Button>
                        <DialogTrigger disableButtonEnhancement>
                            <Button appearance="secondary">Close</Button>
                        </DialogTrigger>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
};

export default SettingsDialog;

const SettingsDialogContent: FC<TSettingsDialogContentProps> = ({
    allowedIpAddresses,
    accessTokens,
    onChangeIpAddressesTextarea,
    onChangeAccessTokensTextarea
}) => {
    const classes = useStyles();
    const ipAddressTextareaRef = useRef<HTMLTextAreaElement>(null);
    const tokensTextareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        handleIpAddressTextarea();
        handleAccessTokensTextarea();
    }, [allowedIpAddresses, accessTokens])

    const handleIpAddressTextarea = () => {
        const el = ipAddressTextareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    };

    const handleAccessTokensTextarea = () => {
        const el = tokensTextareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    }

    return <>
        <div style={{ marginBottom: '20px' }}>
            <Label htmlFor="allowed-ip-addresses-textarea" className={classes.label}>
                Allowed IP Addresses
            </Label>
            <Textarea id="allowed-ip-addresses-textarea"
                      onInput={handleIpAddressTextarea}
                      ref={ipAddressTextareaRef}
                      className={classes.textarea}
                      placeholder="Ip addresses"
                      onChange={onChangeIpAddressesTextarea}
                      value={allowedIpAddresses.join('\n')} />
        </div>
        <div className="mt-3">
            <Label htmlFor="access-tokens-textarea" className={classes.label}>
                Access Tokens
            </Label>
            <Textarea id="access-tokens-textarea"
                      ref={tokensTextareaRef}
                      onInput={handleAccessTokensTextarea}
                      className={classes.textarea}
                      placeholder="Access Tokens"
                      onChange={onChangeAccessTokensTextarea}
                      value={accessTokens.join('\n')} />
        </div>
    </>
}