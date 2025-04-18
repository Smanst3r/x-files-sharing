import {
    Controller,
    Post, Req,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Request } from 'express';
import * as fs from "fs";
import { AppService } from "./app.service";
import * as path from "path";

type TResponseFile = {
    id: number
    fileName: string
    size: number
    link: string
    token: string
    tokenIsExpired: boolean
    tokenExpiresAt: Date
}

@Controller('upload')
export class UploadController {
    constructor(private readonly appService: AppService) {}

    @Post()
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'file' }
            ],
            {
                storage: diskStorage({
                    destination: (req, file, cb) => {
                        const uploadDir = req.session.user?.uploadDir;
                        if (!uploadDir) {
                            return cb(new Error('User session is missing upload dir'), '');
                        }

                        const userDirectory = join('./uploads', uploadDir);
                        fs.mkdirSync(userDirectory, { recursive: true });
                        cb(null, userDirectory);
                    },
                    filename: (req, file, cb) => {
                        let originalFilename = Buffer.from(file.originalname, 'latin1').toString('utf8'); // This fix issue with cyrillic file names
                        originalFilename = path.basename(originalFilename);
                        let baseName = originalFilename.replace(extname(originalFilename), '');

                        const extension = extname(originalFilename);
                        const fileName = `${baseName}${extension}`;
                        cb(null, fileName);
                    },
                }),
            }
        )
    )
    async uploadFile(@UploadedFiles() files: { file?: Express.Multer.File[] }, @Req() req: Request) {
        const sessionId = req.sessionID;
        const response: { statusCode: number, files: TResponseFile[] } = {
            statusCode: 200,
            files: [],
        };

        if (files?.file) {
            for (const file of files.file) {
                const fileEntity = await this.appService.saveFile(file.filename, sessionId);

                response.files.push({
                    id: fileEntity.id,
                    fileName: file.filename,
                    size: file.size,
                    link: `/share/${fileEntity.token}`,
                    token: fileEntity.token,
                    tokenIsExpired: new Date() > fileEntity.expiresAt,
                    tokenExpiresAt: fileEntity.expiresAt,
                });
            }
        }

        return response;
    }
}
