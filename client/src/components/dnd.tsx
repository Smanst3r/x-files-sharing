import { useDropzone } from 'react-dropzone';
import { FC, PropsWithChildren, useState } from "react";
import { makeStyles, tokens } from "@fluentui/react-components";

type TProps = {
    onFilesAccepted: (files: File[]) => void;
    disabled?: boolean
};

const useStyles = makeStyles({
    dropzoneOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: `3px dashed ${tokens.colorBrandBackground}`,
        borderRadius: '12px',
        backgroundColor: 'rgba(0, 120, 212, 0.05)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2.5rem',
        color: tokens.colorBrandForeground1,
        pointerEvents: 'none',
        fontWeight: 'bold'
    },
});

const DnD: FC<PropsWithChildren<TProps>> = ({ onFilesAccepted, disabled, children }) => {
    const classes = useStyles();
    const [isDragging, setIsDragging] = useState(false);

    const {
        getRootProps,
        getInputProps,
    } = useDropzone({
        noClick: true,
        noKeyboard: true,
        onDragEnter: () => setIsDragging(true),
        onDragLeave: () => setIsDragging(false),
        onDrop: (acceptedFiles) => {
            onFilesAccepted(acceptedFiles);
            setIsDragging(false);
        },
    });

    if (disabled) {
        return <>{children}</>;
    }

    return (
        <div {...getRootProps()} style={{ position: 'relative' }}>
            <input {...getInputProps()} />
            {isDragging && (
                <div className={classes.dropzoneOverlay}>
                    Drop files to upload
                </div>
            )}
            {children}
        </div>
    );
};

export default DnD;
