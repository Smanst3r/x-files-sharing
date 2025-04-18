import { FC, useState, useEffect, MouseEvent } from "react";
import {
    createTableColumn,
    makeStyles,
    MessageBar,
    MessageBarBody,
    MessageBarTitle,
    Table,
    TableBody,
    TableCell,
    TableCellLayout,
    TableColumnDefinition, TableColumnId,
    TableHeader, TableHeaderCell,
    TableRow, useTableFeatures, useTableSort,
    Text, Subtitle1, tokens, Tooltip,
} from "@fluentui/react-components";
import { formatFileSize } from "@/lib/utils.ts";
import { format } from "date-fns";
import {
    SpinnerIosRegular,
    NewRegular
} from '@fluentui/react-icons';
import useCommonStyles from "@/styles.tsx";
import UploadButton from "@/components/files-layout/upload-button.tsx";
import CopyShareLinkButton from "@/components/files-layout/copy-share-link-button.tsx";
import api from "@/lib/axios.ts";
import { AxiosError, AxiosResponse } from "axios";
import FileActionsMenu from "@/components/files-layout/file-actions-menu.tsx";
import FileLifetimeBadge from "@/components/files-layout/file-lifetime-badge.tsx";
import FileTokenBadge from "@/components/files-layout/file-token-badge.tsx";
import FileUploadProgress from "@/components/files-layout/file-upload-progress.tsx";
import DnD from "@/components/dnd.tsx";

type TFileStat = {
    name: string,
    size: number,
    mtime: string,
    ctime?: Date,
    isFile: boolean,
    isDirectory: boolean,
    dateOfRemoval?: string
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
    tokenIsExpired: boolean
    downloadLink: string
}

export type TGridFile = {
    stat: TFileStat
} & Partial<TUploadingFile> & Partial<TUploadedFile>;

type TUploadResponse = {
    statusCode: number
    files: {
        id: number
        fileName: string
        link: string
        size: number
        token: string
        tokenIsExpired: boolean
        tokenExpiresAt: string
    }[]
}

const useStyles = makeStyles({
    root: {
        padding: '20px 32px 20px 24px',
    },
    spinner: {
        animation: 'spin 1s linear infinite',
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

const columns: TableColumnDefinition<TGridFile>[] = [
    createTableColumn<TGridFile>({
        columnId: 'filename',
        compare: (a, b) => a.stat.name.localeCompare(b.stat.name),
        renderHeaderCell: () => <Text weight="bold">Filename</Text>,
    }),
    createTableColumn<TGridFile>({
        columnId: 'size',
        compare: (a, b) => a.stat.size - b.stat.size,
        renderHeaderCell: () => <Text weight="bold">Size</Text>,
    }),
    createTableColumn<TGridFile>({
        columnId: 'mtime',
        compare: (a, b) => {
            return new Date(b.stat.mtime).getTime() - new Date(a.stat.mtime).getTime();
        },
        renderHeaderCell: () => <Text weight="bold">Last modified</Text>,
    }),
    createTableColumn<TGridFile>({
        columnId: 'actions',
        renderHeaderCell: () => undefined,
    })
]

export const Grid: FC = () => {
    const classes = useStyles();
    const commonClasses = useCommonStyles();
    const [files, setFiles] = useState<TGridFile[]>([]);
    const [userAddedFiles, setUserAddedFiles] = useState<string[]>([]);

    const [sortState, setSortState] = useState<{
        sortDirection: "ascending" | "descending";
        sortColumn: TableColumnId | undefined;
    }>({
        sortDirection: "descending" as const,
        sortColumn: "mtime",
    });
    const {
        getRows,
        sort: {getSortDirection, toggleColumnSort, sort},
    } = useTableFeatures(
        {
            columns,
            items: files,
        },
        [
            useTableSort({
                sortState,
                onSortChange: (_, nextSortState) => setSortState(nextSortState),
            }),
        ]
    );
    const headerSortProps = (columnId: TableColumnId) => ({
        onClick: (e: MouseEvent) => toggleColumnSort(e, columnId),
        sortDirection: getSortDirection(columnId),
    });

    const rows = sort(getRows());

    const [filesDaysLifetime, setFilesDaysLifetime] = useState<number>(0);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    useEffect(() => {
        api.get('/user-files').then((response: AxiosResponse<{ files: TGridFile[], filesDaysLifetime: string }>) => {
            setFiles(response.data.files);
            setFilesDaysLifetime(parseInt(response.data.filesDaysLifetime));
        })
        return () => {
            //
        }
    }, []);

    const handleUploadButton = (addedFiles: File[]) => {
        const readyToUploadFiles: TGridFile[] = [];
        const validationErrors: string[] = [];
        Array.from(addedFiles).forEach((file) => {
            let gridFile: TGridFile;
            const existingFile = files.find(f => f.stat.name === file.name);

            if (existingFile) {
                gridFile = {...existingFile, isUploading: true, isUploadedSuccessfully: false, uploadError: ''};
            } else {
                gridFile = {
                    stat: {
                        name: file.name,
                        size: file.size,
                        mtime: new Date(file.lastModified).toString(),
                        isDirectory: false,
                        isFile: true,
                    },
                    isUploading: true,
                    isUploadedSuccessfully: false,
                    uploadError: '',
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
                                tokenIsExpired: uploadedFile.tokenIsExpired,
                                downloadLink: uploadedFile.link,
                            };
                        }
                        return f;
                    })
                );
            }).catch((reason: AxiosError) => {
                setFiles(prev =>
                    prev.map(f => {
                        if (f.stat.name === file.name) {
                            return {
                                ...f,
                                isUploading: false,
                                isUploadedSuccessfully: false,
                                uploadError: reason.message,
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

        // Avoid duplicates
        setUserAddedFiles(prev => {
            const set = new Set(prev);
            readyToUploadFiles.forEach(f => set.add(f.stat.name));
            return Array.from(set);
        });

        setValidationErrors(validationErrors);
    }

    const onFileRemovedSuccess = (file: TGridFile) => {
        setFiles((prev) => prev.filter(f => f.stat.name !== file.stat.name));
    }

    const onFileRemovedFailure = (error: string) => {
        setValidationErrors([error]);
    }

    return <DnD onFilesAccepted={handleUploadButton}>
        <div className={classes.root} id="files-grid">
            <h2 className={classes.gridHeader}>
                <div>My files <UploadButton handleUpload={(filesList) => handleUploadButton(Array.from(filesList))}/>
                </div>
                <div>
                    <Subtitle1 className={classes.gridHeaderHint}>Or drag and drop files anywhere on grid</Subtitle1>
                </div>
            </h2>
            <div style={{marginTop: '2rem', marginBottom: '2rem'}}>
                <MessageBar intent="warning">
                    <MessageBarBody>
                        <MessageBarTitle>Please note</MessageBarTitle>
                        Your files will be stored for {filesDaysLifetime} day{filesDaysLifetime === 1 ? '' : 's'}.
                    </MessageBarBody>
                </MessageBar>
            </div>

            {validationErrors.length > 0
                ? <MessageBar intent="error" layout="multiline">
                    <MessageBarBody>
                        <MessageBarTitle>Error</MessageBarTitle>
                        {validationErrors.map((err, i) => {
                            return <div key={`err-${i}`}>{err}</div>
                        })}
                    </MessageBarBody>
                </MessageBar>
                : <></>
            }

            <Table style={{width: "100%", tableLayout: 'auto'}}>
                <TableHeader>
                    <TableRow>
                        <TableHeaderCell {...headerSortProps("filename")}>
                            <Text weight="bold">Filename</Text>
                        </TableHeaderCell>
                        <TableHeaderCell {...headerSortProps("size")}>
                            <Text weight="bold">Size</Text>
                        </TableHeaderCell>
                        <TableHeaderCell {...headerSortProps("mtime")}>
                            <TableCellLayout style={{justifyContent: 'end'}}>
                                <Text weight="bold">Last modified</Text>
                            </TableCellLayout>
                        </TableHeaderCell>
                        <TableHeaderCell></TableHeaderCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((rowData) => {
                        const file = rowData.item;

                        return <TableRow key={rowData.rowId}>
                            <TableCell tabIndex={0}>
                                <TableCellLayout media={
                                    (userAddedFiles.includes(file.stat.name) && file.isUploadedSuccessfully)
                                        ? <Tooltip content="New file" relationship="label">
                                            <NewRegular/>
                                        </Tooltip>
                                        : <></>
                                }>
                                    <Text>
                                        <span style={{marginRight: '5px'}}>{file.stat.name}</span>
                                        {file.isUploading === true && <SpinnerIosRegular className={classes.spinner}/>}
                                        <FileTokenBadge file={file}/>
                                        <FileLifetimeBadge file={file}/>
                                    </Text>
                                    <FileUploadProgress file={file}/>
                                    {!!file.uploadError
                                        ? <div className={commonClasses.errorText}>
                                            {file.uploadError}
                                        </div>
                                        : undefined
                                    }
                                </TableCellLayout>
                            </TableCell>
                            <TableCell tabIndex={0} style={{whiteSpace: 'nowrap'}}>
                                {formatFileSize(file.stat.size)}
                            </TableCell>
                            <TableCell tabIndex={0} style={{textAlign: 'right', whiteSpace: 'nowrap'}}>
                                {format(file.stat.mtime, 'MMM dd, yyyy HH:mm')}
                            </TableCell>
                            <TableCell tabIndex={0} style={{textAlign: 'right', whiteSpace: 'nowrap'}}>
                                {!!file.downloadLink && <CopyShareLinkButton downloadLink={file.downloadLink}/>}
                                {!!file.id && <FileActionsMenu fileId={file.id}
                                                               onFileRemovedSuccess={() => onFileRemovedSuccess(file)}
                                                               onFileRemovedFailure={onFileRemovedFailure}/>}
                            </TableCell>
                        </TableRow>
                    })}
                </TableBody>
            </Table>
        </div>
    </DnD>
}

export default Grid;