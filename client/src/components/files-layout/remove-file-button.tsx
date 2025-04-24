import { FC, MouseEvent, useState } from "react";
import { Button } from "@fluentui/react-components";
import api from "@/lib/axios.ts";
import useCommonStyles from "@/styles.tsx";

type TProps = {
    fileId: number | string
    onFileRemovedSuccess: () => void
    onFileRemovedFailure: (error: string) => void
}

export const RemoveFileButton: FC<TProps> = ({ fileId, onFileRemovedSuccess, onFileRemovedFailure }) => {
    const classes = useCommonStyles();
    const [isRemoving, setIsRemoving] = useState<boolean>(false);

    const handleDelete = (event: MouseEvent) => {
        if (!confirm('Do you really want to remove a file?')) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }

        setIsRemoving(true);
        api.post(`/remove-file/${fileId}`)
            .then(() => { onFileRemovedSuccess() })
            .catch(reason => { onFileRemovedFailure(reason.toString()) })
            .finally(() => setIsRemoving(false));
    }

    return <Button onClick={handleDelete} disabled={isRemoving} className={classes.textDanger}>
        {isRemoving ? 'Removing' : 'Remove'}
    </Button>
}

export default RemoveFileButton;