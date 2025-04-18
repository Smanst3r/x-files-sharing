import { Body, Controller, Get, NotFoundException, Param, Post, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';
import { ConfigService } from "@nestjs/config";

@Controller()
export class AppController {
    constructor(private readonly appService: AppService, private config: ConfigService) {
    }

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Get('website-settings')
    getWebsiteSettings() {
        const websiteSettings = this.appService.getWebsiteSettings();
        return {
            allowed_ip_addresses: websiteSettings.allowedIpAddresses,
            access_tokens: websiteSettings.accessTokens,
        }
    }

    @Post('website-settings')
    saveWebsiteSettings(@Body() data: { allowed_ip_addresses: string[]; access_tokens: string[] }) {
        this.appService.saveWebsiteSettings(data.allowed_ip_addresses, data.access_tokens);
        return { status: 'ok' }
    }

    @Get('user-files')
    async getUserFiles(@Req() req: Request) {
        const userUploadDir = req.session.user?.uploadDir;
        const sessionId = req.sessionID;

        if (!userUploadDir) {
            return { files: [] };
        }

        const files = await this.appService.getUserFiles(sessionId, userUploadDir);
        return {
            files,
            filesDaysLifetime: this.config.get('UPLOADED_FILES_LIFETIME_DAYS'),
        };
    }

    @Post('remove-file/:fileId')
    async remove(@Param('fileId') fileIdParam: string, @Req() req: Request) {
        if (req.session.user?.uploadDir) {
            const fileId = parseInt(fileIdParam);
            await this.appService.removeFile(req.session.user.uploadDir, fileId);
            return {
                status: 'ok'
            };
        }
    }

    @Get('share/:token')
    async downloadByToken(@Req() req: Request, @Param('token') token: string, @Res() res: Response) {
        const fileData = await this.appService.getFileByToken(token);

        if (!fileData) {
            throw new NotFoundException('File not found or link has expired');
        }
        if (new Date() > fileData.expiresAt) {
            throw new NotFoundException('Download link has expired');
        }

        const uploadDir = req.session.user?.uploadDir;
        return res.sendFile(fileData.fileName, { root: './uploads/'+uploadDir });
    }

    @Get('download/:fileId')
    async downloadMyFile(@Param('fileId') fileIdParam: string, @Req() req: Request, @Res() res: Response) {
        const sessionId = req.sessionID;
        const fileId = parseInt(fileIdParam, 10);
        const fileData = await this.appService.getFile(fileId);

        if (!req.session.user?.authenticated || fileData?.sessionId !== sessionId) {
            // User can download only his files
            return res.status(401).send();
        }

        if (!fileData) {
            return res.status(404).send();
        }

        const uploadDir = req.session.user?.uploadDir;
        res.setHeader('Content-Disposition', `attachment; filename="${fileData.fileName}"`);
        return res.sendFile(fileData.fileName, { root: './uploads/'+uploadDir });
    }
}
