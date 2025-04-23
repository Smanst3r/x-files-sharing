import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadedFileEntity } from "../upload/uploaded-file.entity";
import { join } from "path";
import { DEFAULT_FILES_LIFETIME_DAYS, paths } from "../main";

@Injectable()
export class CleanupService {
    private readonly logger = new Logger(CleanupService.name);
    private readonly fileLifetimeMs: number;

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(UploadedFileEntity)
        private readonly filesRepo: Repository<UploadedFileEntity>,
    ) {
        const days = parseInt(this.configService.get('UPLOADED_FILES_LIFETIME_DAYS', DEFAULT_FILES_LIFETIME_DAYS+''), 10);
        this.fileLifetimeMs = days * 24 * 60 * 60 * 1000;
    }

    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async handleFileCleanup() {
        const uploadsDir = paths.uploads;
        this.logger.log('Running file cleanup task...');
        const now = Date.now();

        if (!fs.existsSync(uploadsDir)) {
            return;
        }

        const sessionDirs = fs.readdirSync(uploadsDir);
        for (const sessionId of sessionDirs) {
            const sessionPath = join(uploadsDir, sessionId);
            if (!fs.statSync(sessionPath).isDirectory()) {
                continue;
            }

            const files = fs.readdirSync(sessionPath);
            for (const file of files) {
                const filePath = join(sessionPath, file);
                const stats = fs.statSync(filePath);

                const expired = stats.mtime.getTime() + this.fileLifetimeMs < now;
                if (expired) {
                    fs.unlinkSync(filePath);
                    this.logger.log(`Deleted expired file: ${filePath}. Session: ${sessionId}`);
                    await this.filesRepo.delete({ fileName: file, sessionId });
                }
            }

            // Check if session folder is empty
            const remainingFiles = fs.readdirSync(sessionPath);
            if (remainingFiles.length === 0) {
                fs.rmdirSync(sessionPath);
                this.logger.log(`Removed empty session folder: ${sessionPath}`);
            }
        }
    }
}