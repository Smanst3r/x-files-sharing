import { Link, makeStyles, Tag, tokens } from "@fluentui/react-components";
import { ShareAndroidRegular } from "@fluentui/react-icons/lib/fonts";
import { format, formatDistanceToNow } from "date-fns";
import { FC } from "react";
import { TGridFile } from "@/components/files-layout/grid.tsx";
import useCommonStyles from "@/styles.tsx";

type TProps = {
    file: TGridFile
}

const useStyles = makeStyles({
    tag: {
        marginLeft: '5px',
    },
    expiresAtTagText: {
        color: tokens.colorNeutralForeground3,
    },
});

export const FileTokenBadge: FC<TProps> = ({ file }) => {
    if (!file.token || !file.tokenExpiresAt) {
        return null;
    }

    const commonClasses = useCommonStyles();
    const classes = useStyles();

    return <Tag icon={<ShareAndroidRegular />}
                size="small"
                className={classes.tag}
                appearance={file.tokenIsExpired ? 'filled' : 'brand'}>
        <Link href={file.downloadLink} target="_blank" style={{ marginRight: '5px', textDecoration: 'underline' }}>
            {file.downloadLink}
        </Link>
        {file.tokenIsExpired
            ? <span className={commonClasses.textDanger}>
                Expired {format(file.tokenExpiresAt, 'MMM dd, yyyy HH:mm')}
            </span>
            : <span className={classes.expiresAtTagText}>
                Expires {formatDistanceToNow(file.tokenExpiresAt, { addSuffix: true })}
            </span>
        }
    </Tag>
}

export default FileTokenBadge;