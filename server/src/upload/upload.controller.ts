import {
    Controller,
    InternalServerErrorException,
    Post, Req,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join, resolve, basename } from 'path';
import { Request } from 'express';
import * as fs from "fs";
import { AppService } from "../app.service";
import { DEFAULT_FILES_LIFETIME_DAYS, paths } from "../main";
import { ConfigService } from "@nestjs/config";

type TResponseFile = {
    id: number
    fileName: string
    size: number
    link: string
    token: string
    tokenIsExpired: boolean
    tokenExpiresAt: Date
} & Partial<TFileStat>

const getFileName = (file: Express.Multer.File): string => {
    let originalFilename = Buffer.from(file.originalname, 'latin1').toString('utf8'); // This fix issue with cyrillic file names
    originalFilename = basename(originalFilename);
    let baseName = originalFilename.replace(extname(originalFilename), '');

    const extension = extname(originalFilename);
    return `${baseName}${extension}`;
}

@Controller('upload')
export class UploadController {
    constructor(private readonly appService: AppService, private readonly config: ConfigService) {}

    @Post()
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'file' }
            ],
            {
                storage: diskStorage({
                    destination: (req, file, cb) => {
                        const userUploadDir = req.session.user?.uploadDir;
                        if (!userUploadDir) {
                            return cb(new Error('User session is missing upload dir'), '');
                        }

                        const userDirectory = resolve(join(paths.uploads, userUploadDir));
                        fs.mkdirSync(userDirectory, { recursive: true });
                        cb(null, userDirectory);
                    },
                    filename: (req, file, cb) => {
                        cb(null, getFileName(file));
                    },
                }),
            },
        )
    )
    async uploadFile(@UploadedFiles() files: { file?: Express.Multer.File[] }, @Req() req: Request) {
        const sessionId = req.sessionID;
        const uploadDir = req.session.user?.uploadDir;
        if (!uploadDir) {
            throw new InternalServerErrorException('Not found upload dir for user session');
        }

        const uploadedFilesTtl = parseInt(this.config.get('UPLOADED_FILES_LIFETIME_DAYS', DEFAULT_FILES_LIFETIME_DAYS+''));
        const response: { statusCode: number, files: TResponseFile[] } = {
            statusCode: 200,
            files: [],
        };

        if (files?.file) {
            for (const file of files.file) {
                const fileName = getFileName(file);
                const fileEntity = await this.appService.saveFile(fileName, sessionId, uploadDir);
                const fullPath = resolve(paths.uploads, uploadDir, fileName);
                const stat = fs.statSync(fullPath);

                response.files.push({
                    id: fileEntity.id,
                    fileName: file.filename,
                    size: file.size,
                    link: `/d/${fileEntity.token}`,
                    token: fileEntity.token,
                    tokenIsExpired: new Date() > fileEntity.expiresAt,
                    tokenExpiresAt: fileEntity.expiresAt,
                    mtime: stat.mtime,
                });
            }
        }

        return response;
    }
}
