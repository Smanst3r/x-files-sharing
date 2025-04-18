import { FC } from "react";
import { TGridFile } from "@/components/files-layout/grid.tsx";
import { Field, ProgressBar } from "@fluentui/react-components";

type TProps = {
    file: TGridFile
}

export const FileUploadProgress: FC<TProps> = ({ file }) => {
    if (!file.isUploading || !file.uploadProgress) {
        return;
    }
    if (file.uploadProgress <= 0 || file.uploadProgress >= 100) {
        return;
    }

    return <Field validationMessage={`Uploading ${file.uploadProgress}%`} validationState="none">
        <ProgressBar value={file.uploadProgress / 100} />
    </Field>
}

export default FileUploadProgress;