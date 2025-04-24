import { FC } from "react";
import { Button } from "@fluentui/react-components";
import { TGridFile } from "@/components/files-layout/grid.tsx";

type TProps = {
    file: TGridFile
}

export const DownloadFileButton: FC<TProps> = ({ file }) => {
    return <Button as="a" href={`${file.downloadLink}`} target="_blank">
        Download
    </Button>
}

export default DownloadFileButton;