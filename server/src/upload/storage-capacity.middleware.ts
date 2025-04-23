import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { resolve, join } from 'path';
import { statSync, readdirSync } from 'fs';
import { DEFAULT_STORAGE_MAX_CAPACITY, paths } from "../main";

const getDirectoryUsedSize = (dirPath: string): number => {
    const entries = readdirSync(dirPath, { withFileTypes: true });

    return entries.reduce((total, entry) => {
        const fullPath = join(dirPath, entry.name);
        if (entry.isDirectory()) {
            return total + getDirectoryUsedSize(fullPath);
        } else {
            try {
                return total + statSync(fullPath).size;
            } catch {
                return total;
            }
        }
    }, 0);
};


@Injectable()
export class StorageCapacityMiddleware implements NestMiddleware {
    private readonly logger = new Logger(StorageCapacityMiddleware.name);

    constructor(private readonly config: ConfigService) {}

    use(req: Request, res: Response, next: NextFunction) {
        try {
            const uploadsRoot = resolve(paths.uploads);
            const usedSize = getDirectoryUsedSize(uploadsRoot);
            const maxCapacity = parseInt(this.config.get('UPLOADS_STORAGE_MAX_CAPACITY', DEFAULT_STORAGE_MAX_CAPACITY+''), 10);
            const estimatedFileSize = parseInt(req.headers['content-length'] || '0', 10);

            if (usedSize + estimatedFileSize > maxCapacity) {
                this.logger.error(`Exceeded storage capacity limit. Upload functionality is blocked`);
                return res.status(413).json({ message: 'Sorry, storage capacity exceeded. You can not upload this file.' });
            }

            next();
        } catch (err) {
            this.logger.error(`Failed to check storage capacity: ${err.message}`);
            return res.status(500).json({ message: 'Cannot upload. Internal server error' });
        }
    }
}
