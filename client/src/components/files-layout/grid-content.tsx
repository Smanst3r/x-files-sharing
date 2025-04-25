import { FC, MouseEvent, useState } from "react";
import {
    createTableColumn,
    Field,
    MessageBar,
    MessageBarBody,
    MessageBarTitle, ProgressBar,
    Table, TableBody, TableCell,
    TableCellLayout,
    TableColumnDefinition,
    TableColumnId,
    TableHeader,
    TableHeaderCell,
    TableRow, Text,
    useTableFeatures,
    useTableSort
} from "@fluentui/react-components";
import CopyShareLinkButton from "@/components/files-layout/copy-share-link-button.tsx";
import DownloadFileButton from "@/components/files-layout/download-file-button.tsx";
import RemoveFileButton from "@/components/files-layout/remove-file-button.tsx";
import { NewRegular, SpinnerIosRegular } from "@fluentui/react-icons/lib/fonts";
import FileUploadProgress from "@/components/files-layout/file-upload-progress.tsx";
import { formatFileSize } from "@/lib/utils.ts";
import { format, formatDistanceToNow } from "date-fns";
import useCommonStyles from "@/styles.tsx";
import { TGridFile } from "@/components/files-layout/grid.tsx";

const columns: TableColumnDefinition<TGridFile>[] = [
    createTableColumn<TGridFile>({
        columnId: 'actions',
        renderHeaderCell: () => undefined,
    }),
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
        columnId: 'tokenExpiresAt',
        compare: (a, b) => {
            if (a.tokenExpiresAt && b.tokenExpiresAt) {
                return new Date(a.tokenExpiresAt).getTime() - new Date(b.tokenExpiresAt).getTime();
            }
            return 0;
        },
        renderHeaderCell: () => <TableCellLayout style={{justifyContent: 'end', whiteSpace: 'nowrap'}}>
            <Text weight="bold">Expires in</Text>
        </TableCellLayout>,
    }),
    createTableColumn<TGridFile>({
        columnId: 'mtime',
        compare: (a, b) => {
            return new Date(b.stat.mtime).getTime() - new Date(a.stat.mtime).getTime();
        },
        renderHeaderCell: () => <TableCellLayout style={{justifyContent: 'end'}}>
            <Text weight="bold">Uploaded at</Text>
        </TableCellLayout>,
    }),
];

type TProps = {
    isLoadingFiles: boolean
    files: TGridFile[]
    onFileRemovedSuccess: (file: TGridFile) => void
}

export const GridContent: FC<TProps> = ({ files, isLoadingFiles, onFileRemovedSuccess }) => {
    const commonClasses = useCommonStyles();
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const [sortState, setSortState] = useState<{
        sortDirection: "ascending" | "descending";
        sortColumn: TableColumnId | undefined;
    }>({
        sortDirection: "ascending" as const,
        sortColumn: "mtime",
    });

    const {
        getRows,
        sort: {
            getSortDirection,
            toggleColumnSort,
            sort
        },
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
    const headerSortProps = (columnId: TableColumnId) => {
        if (columnId === 'actions') {
            return {};
        }
        return {
            onClick: (e: MouseEvent) => toggleColumnSort(e, columnId),
            sortDirection: getSortDirection(columnId),
        }
    };

    const onFileRemovedFailure = (error: string) => {
        setValidationErrors([error]);
    }


    const rows = sort(getRows());

    if (!isLoadingFiles && !rows.length) {
        return <MessageBar>
            <MessageBarBody>
                <MessageBarTitle>Sorry</MessageBarTitle>
                You don't have any files recently uploaded
            </MessageBarBody>
        </MessageBar>
    }

    if (isLoadingFiles && !rows.length) {
        return <Field validationMessage="Loading files" validationState="none">
            <ProgressBar/>
        </Field>
    }

    return <>
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
        <Table style={{width: "100%", tableLayout: 'auto'}} sortable>
            <TableHeader>
                <TableRow>
                    {columns.map((col) => {
                        return <TableHeaderCell key={`th-${col.columnId}`} {...headerSortProps(col.columnId)}>
                            {col.renderHeaderCell()}
                        </TableHeaderCell>
                    })}
                </TableRow>
            </TableHeader>
            <TableBody>
                {(isLoadingFiles && !rows.length) &&
                    <TableRow>
                        <TableCell tabIndex={0} colSpan={columns.length}>
                            <Field validationMessage="Loading files" validationState="none">
                                <ProgressBar/>
                            </Field>
                        </TableCell>
                    </TableRow>
                }
                {rows.map((rowData) => {
                    const file = rowData.item;

                    return <TableRow key={rowData.rowId}>
                        <TableCell tabIndex={0} style={{whiteSpace: 'nowrap', textAlign: 'right', width: '1%'}}>
                            <div style={{display: 'inline-flex', gap: '5px'}}>
                                {!!file.downloadLink && <CopyShareLinkButton downloadLink={file.downloadLink}/>}
                                {!!file.id && <DownloadFileButton file={file}/>}
                                {!!file.id && <RemoveFileButton fileId={file.id}
                                                                onFileRemovedSuccess={() => onFileRemovedSuccess(file)}
                                                                onFileRemovedFailure={onFileRemovedFailure}/>}
                            </div>
                        </TableCell>
                        <TableCell tabIndex={0}>
                            <TableCellLayout media={
                                (!!file.userAddedAt && file.isUploadedSuccessfully)
                                    ? <NewRegular />
                                    : <></>
                            } appearance="primary" description={file.downloadLink ? `${window.location.origin}${file.downloadLink}` : undefined}>
                                <Text>
                                    <span style={{marginRight: '5px'}}>{file.stat.name}</span>
                                    {file.isUploading === true && <SpinnerIosRegular className={commonClasses.spinner}/>}
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
                            {file.tokenExpiresAt ? <>
                                {format(file.tokenExpiresAt, 'MMM dd, yyyy HH:mm')}{' '}
                                ({formatDistanceToNow(file.tokenExpiresAt, {addSuffix: true})})
                            </> : undefined}
                        </TableCell>
                        <TableCell tabIndex={0} style={{textAlign: 'right', whiteSpace: 'nowrap'}}>
                            {format(file.stat.mtime, 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                    </TableRow>
                })}
            </TableBody>
        </Table>
    </>
}

export default GridContent;