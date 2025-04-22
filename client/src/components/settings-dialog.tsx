import { ChangeEvent, FC, useEffect, useRef, useState } from "react";
import {
    Dialog,
    DialogTrigger,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogActions,
    DialogContent,
    Button, Label, Textarea, makeStyles,
} from "@fluentui/react-components";
import { SettingsRegular } from '@fluentui/react-icons';
import api from "@/lib/axios.ts";

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
    const [open, setOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [allowedIpAddresses, setAllowedIpAddresses] = useState<string[]>([]);
    const [accessTokens, setAccessTokens] = useState<string[]>([]);

    const onChangeIpAddressesTextarea = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setAllowedIpAddresses(event.target.value.split('\n'))
    }

    const onChangeAccessTokensTextarea = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setAccessTokens(event.target.value.split('\n'));
    }

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await api.post(`/website-settings`, {
                allowed_ip_addresses: allowedIpAddresses,
                access_tokens: accessTokens,
            });
            setOpen(false);
        } catch (error: any) {
            setError(error.toString());
        } finally {
            setIsLoading(false);
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
                    <DialogTitle>IP Whitelist & Access Tokens</DialogTitle>
                    <DialogContent>
                        <div style={{ marginBottom: '10px' }}>
                            Put client IP address or share one of available access tokens.
                            <br/>Use new line as delimiter
                        </div>
                        {isLoading
                            ? <div>Loading...</div>
                            : error
                                ? <div className="text-red-700">Error: {error}</div>
                                : <SettingsDialogContent allowedIpAddresses={allowedIpAddresses}
                                                         accessTokens={accessTokens}
                                                         onChangeAccessTokensTextarea={onChangeAccessTokensTextarea}
                                                         onChangeIpAddressesTextarea={onChangeIpAddressesTextarea} />
                        }
                    </DialogContent>
                    <DialogActions>
                        <Button type="button" appearance="primary" onClick={handleSave}>Save</Button>
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