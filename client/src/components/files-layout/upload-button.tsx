import { ChangeEvent, ComponentProps, FC, useRef } from "react";
import { Button } from "@fluentui/react-components";
import { DocumentAddRegular } from "@fluentui/react-icons/lib/fonts";

type TProps = {
    handleUpload: (files: FileList) => void
} & ComponentProps<typeof Button>

export const UploadButton: FC<TProps> = ({ handleUpload, disabled }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        inputRef.current?.click();
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            handleUpload(event.target.files);
        }
    };

    return <>
        <Button
            style={{ fontWeight: 'normal' }}
            size="large"
            disabled={disabled}
            appearance="primary"
            icon={<DocumentAddRegular />}
            onClick={handleButtonClick}>
            <span>Upload</span>
        </Button>
        <input
            type="file"
            disabled={disabled}
            multiple={true}
            ref={inputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
        />
    </>
}

export default UploadButton;