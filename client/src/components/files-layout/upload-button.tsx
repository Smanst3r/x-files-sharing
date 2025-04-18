import { ChangeEvent, FC, useRef } from "react";
import { Button } from "@fluentui/react-components";
import { DocumentAddRegular } from "@fluentui/react-icons/lib/fonts";

type TProps = {
    handleUpload: (files: FileList) => void
}

export const UploadButton: FC<TProps> = ({ handleUpload }) => {
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
            appearance="primary"
            icon={<DocumentAddRegular />}
            onClick={handleButtonClick}>
            <span>Upload</span>
        </Button>
        <input
            type="file"
            multiple={true}
            ref={inputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
        />
    </>
}

export default UploadButton;