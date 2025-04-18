import { FC, MouseEvent } from "react";
import { Button, Menu, MenuItem, MenuItemLink, MenuList, MenuPopover, MenuTrigger } from "@fluentui/react-components";
import { ArrowDownloadRegular, DeleteRegular } from "@fluentui/react-icons";
import api from "@/lib/axios.ts";

type TProps = {
    fileId: number | string
    onFileRemovedSuccess: () => void
    onFileRemovedFailure: (error: string) => void
}

export const FileActionsMenu: FC<TProps> = ({fileId, onFileRemovedSuccess, onFileRemovedFailure}) => {

    const handleDelete = (event: MouseEvent) => {
        if (!confirm('Do you really want to remove a file?')) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }

        api.post(`/remove-file/${fileId}`)
            .then(() => { onFileRemovedSuccess() })
            .catch(reason => { onFileRemovedFailure(reason.toString()) });
    }

    return <Menu>
        <MenuTrigger disableButtonEnhancement>
            <Button>More</Button>
        </MenuTrigger>

        <MenuPopover>
            <MenuList>
                <MenuItemLink icon={<ArrowDownloadRegular/>} href={`/download/${fileId}`}>Download</MenuItemLink>
                <MenuItem icon={<DeleteRegular/>} onClick={handleDelete}>Remove</MenuItem>
            </MenuList>
        </MenuPopover>
    </Menu>
}

export default FileActionsMenu;