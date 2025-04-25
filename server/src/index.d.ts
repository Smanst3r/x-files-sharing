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
    }
}

export {};