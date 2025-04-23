declare module "express-session" {
    interface SessionData {
        user?: {
            authenticated: boolean
            uploadDir: string
            authedBy: 'ip'|'token'
        };
    }
}

declare global {
    type TFileStat = {
        name: string,
        size: number,
        mtime: Date,
        ctime: Date,
        isFile: boolean,
        isDirectory: boolean,
        dateOfRemoval?: Date
    }
    type TShareFile = {
        id: number
        token: string
        tokenExpiresAt: Date
        tokenIsExpired: boolean
        downloadLink: string
        dateOfRemoval?: Date,
    }
    type TUploadedFile = {
        stat: TFileStat
    } & TShareFile
}

export {};