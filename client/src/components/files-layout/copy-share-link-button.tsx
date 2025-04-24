import { FC, useRef, useState } from "react";
import { Button } from "@fluentui/react-components";

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

    return <Button appearance="primary" onClick={handleCopy}>
        {copied ? 'Copied' : 'Copy Link'}
    </Button>
}

export default CopyShareLinkButton;