import { FC } from "react";
import { TGridFile } from "@/components/files-layout/grid.tsx";
import { addDays, formatDistanceToNow, isBefore, parseISO } from "date-fns";
import { AlertRegular } from "@fluentui/react-icons";
import { makeStyles, Tag, tokens } from "@fluentui/react-components";

type TProps = {
    file: TGridFile
}

const useStyles = makeStyles({
    tag: {
        marginLeft: '5px',
    },
    icon: {
        color: tokens.colorPaletteRedForeground1,
    }
});

export const FileLifetimeBadge: FC<TProps> = ({ file }) => {
    if (!file.stat.dateOfRemoval) {
        return null;
    }

    const classes = useStyles();
    const removalDate = parseISO(file.stat.dateOfRemoval);
    const now = new Date();
    const isExpiringSoon = isBefore(removalDate, addDays(now, 1));

    if (isExpiringSoon) {
        return (
            <Tag icon={<AlertRegular className={classes.icon} />}
                 size="small"
                 className={classes.tag}
                 appearance="filled">
                File will be removed {formatDistanceToNow(removalDate, { addSuffix: true })}
            </Tag>
        );
    }
    return null;
}

export default FileLifetimeBadge;