import { FC, useRef, useState } from "react";
import { Button } from "@fluentui/react-components";
import { CheckmarkRegular, ClipboardRegular } from "@fluentui/react-icons";

type TProps = {
    downloadLink: string
}

export const CopyShareLinkButton: FC<TProps> = ({ downloadLink }) => {
    const [copied, setCopied] = useState<boolean>(false);
    const copyTimeoutRef = useRef<NodeJS.Timeout|null>(null);

    const handleCopy = () => {
        navigator.clipboard.writeText(`${window.location.origin}${downloadLink}`);
        setCopied(true);
        if (copyTimeoutRef.current) {
            clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => {
            setCopied(false);
        }, 1500);
    }

    return <Button appearance="primary"
                   style={{ marginRight: '5px' }}
                   icon={copied ? <CheckmarkRegular /> : <ClipboardRegular />}
                   onClick={handleCopy}>
        {copied ? 'Copied' : 'Share'}
    </Button>
}

export default CopyShareLinkButton;