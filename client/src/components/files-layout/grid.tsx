import { FC, useState, useEffect } from "react";
import { makeStyles, Subtitle1, tokens } from "@fluentui/react-components";
import UploadButton from "@/components/files-layout/upload-button.tsx";
import api from "@/lib/axios.ts";
import { AxiosError, AxiosResponse } from "axios";
import DnD from "@/components/dnd.tsx";
import GridContent from "@/components/files-layout/grid-content.tsx";

type TFileStat = {
    name: string,
    size: number,
    mtime: string,
}

type TUploadingFile = {
    isUploading: boolean
    isUploadedSuccessfully: boolean
    uploadError: string
    uploadProgress?: number
}

type TUploadedFile = {
    id: number
    token: string
    tokenExpiresAt: Date
    downloadLink: string
}

export type TGridFile = {
    stat: TFileStat
    userAddedAt?: Date
} & Partial<TUploadingFile> & Partial<TUploadedFile>;

type TUploadResponse = {
    statusCode: number
    files: {
        id: number
        fileName: string
        downloadLink: string
        size: number
        token: string
        tokenExpiresAt: string
        mtime: string
    }[]
}

const useStyles = makeStyles({
    root: {
        padding: '20px 32px 20px 24px',
    },
    gridHeader: {
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        border: `2px ${tokens.colorNeutralBackground6} dashed`,
        borderRadius: '16px',
    },
    gridHeaderHint: {
        color: tokens.colorNeutralForeground2Link,
    },
    dragOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: `2px dashed ${tokens.colorBrandBackground}`,
        borderRadius: '12px',
        backgroundColor: 'rgba(0, 120, 212, 0.05)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        color: tokens.colorBrandForeground1,
        pointerEvents: 'none',
    },
});

export const Grid: FC = () => {
    const classes = useStyles();
    const [files, setFiles] = useState<TGridFile[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(true);

    useEffect(() => {
        api.get('/user-files').then((response: AxiosResponse<{ files: TGridFile[] }>) => {
            setFiles(response.data.files);
            setIsLoadingFiles(false);
        })
        return () => {
            //
        }
    }, []);

    const onFileRemovedSuccess = (file: TGridFile) => {
        setFiles((prev) => prev.filter(f => f.stat.name !== file.stat.name));
    }

    const handleUploadButton = (addedFiles: File[]) => {
        const readyToUploadFiles: TGridFile[] = [];

        addedFiles.forEach((file) => {
            let gridFile: TGridFile;
            const existingFile = files.find(f => f.stat.name === file.name);

            if (existingFile) {
                gridFile = {
                    ...existingFile,
                    isUploading: true,
                    isUploadedSuccessfully: false,
                    uploadError: '',
                    userAddedAt: new Date(),
                };
            } else {
                gridFile = {
                    stat: {
                        name: file.name,
                        size: file.size,
                        mtime: new Date().toString(),
                    },
                    isUploading: true,
                    isUploadedSuccessfully: false,
                    uploadError: '',
                    userAddedAt: new Date(),
                }
            }

            readyToUploadFiles.push(gridFile);

            const formData = new FormData();
            formData.append('file', file);
            api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: function (progressEvent) {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setFiles((prev) => {
                            return prev.map(prevFile => {
                                return {
                                    ...prevFile,
                                    ...(prevFile.stat.name === file.name ? {uploadProgress: percentCompleted} : {}),
                                }
                            })
                        });
                    }
                },
            }).then((response: AxiosResponse<TUploadResponse>) => {
                const uploadedFile = response.data.files.find(f => f.fileName === file.name);
                if (!uploadedFile) {
                    return;
                }

                setFiles(prev =>
                    prev.map(f => {
                        if (f.stat.name === file.name) {
                            return {
                                ...f,
                                id: uploadedFile.id,
                                isUploading: false,
                                isUploadedSuccessfully: true,
                                uploadError: '',
                                token: uploadedFile.token,
                                tokenExpiresAt: new Date(uploadedFile.tokenExpiresAt),
                                downloadLink: uploadedFile.downloadLink,
                                stat: {
                                    ...f.stat,
                                    mtime: uploadedFile.mtime,
                                }
                            };
                        }
                        return f;
                    })
                );
            }).catch((reason: AxiosError<{ message?: string }>) => {
                setFiles(prev =>
                    prev.map(f => {
                        if (f.stat.name === file.name) {
                            return {
                                ...f,
                                isUploading: false,
                                isUploadedSuccessfully: false,
                                uploadError: reason.response?.data?.message ?? reason.message,
                            };
                        }
                        return f;
                    })
                );
            });
        });

        // Merge old and new files states
        setFiles(prev => {
            const updatedMap = new Map<string, TGridFile>();
            prev.forEach(f => updatedMap.set(f.stat.name, f));
            readyToUploadFiles.forEach(f => updatedMap.set(f.stat.name, f));
            return Array.from(updatedMap.values());
        });
    }

    return <DnD onFilesAccepted={handleUploadButton}>
        <div className={classes.root} id="files-grid">
            <h2 className={classes.gridHeader}>
                <div><UploadButton handleUpload={(filesList) => handleUploadButton(Array.from(filesList))}/>
                </div>
                <div>
                    <Subtitle1 className={classes.gridHeaderHint}>or drag and drop files anywhere on grid</Subtitle1>
                </div>
            </h2>

            <GridContent files={files} isLoadingFiles={isLoadingFiles} onFileRemovedSuccess={onFileRemovedSuccess} />
        </div>
    </DnD>
}

export default Grid;