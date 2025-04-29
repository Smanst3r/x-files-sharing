import { Body, Controller, Get, NotFoundException, Param, Post, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';
import { join, resolve } from "path";
import { paths } from "./main";

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    getIndex(@Req() req: Request) {
        return {
            authenticatedBy: req.session.user?.authedBy,
        }
    }

    @Get('website-settings')
    getWebsiteSettings(@Req() req: Request, @Res() res: Response) {
        if (req.session.user?.authedBy !== 'ip') {
            return res.status(401).send('Unauthorized');
        }
        const websiteSettings = this.appService.getWebsiteSettings();
        return res.status(200).json({
            allowed_ip_addresses: websiteSettings.allowedIpAddresses,
            access_tokens: websiteSettings.accessTokens,
        });
    }

    @Post('website-settings')
    saveWebsiteSettings(@Body() data: { allowed_ip_addresses: string[]; access_tokens: string[] }, @Req() req: Request, @Res() res: Response) {
        if (req.session.user?.authedBy !== 'ip') {
            return res.status(401).send('Unauthorized');
        }
        this.appService.saveWebsiteSettings(data.allowed_ip_addresses, data.access_tokens);
        return res.status(204).send();
    }

    @Get('user-files')
    async getUserFiles(@Req() req: Request) {
        const userUploadDir = req.session.user?.uploadDir;
        const sessionId = req.sessionID;

        if (!userUploadDir) {
            return { files: [] };
        }

        const files = await this.appService.getUserFiles(sessionId, userUploadDir);
        return { files };
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

    @Get('d/:token')
    async downloadByToken(@Req() req: Request, @Param('token') token: string, @Res() res: Response) {
        const fileData = await this.appService.getFileByToken(token);

        if (!fileData) {
            throw new NotFoundException('Not found');
        }
        if (new Date() > fileData.expiresAt) {
            throw new NotFoundException('Download link has expired');
        }

        res.setHeader('Content-Disposition', `filename="${encodeURIComponent(fileData.fileName)}"`);
        return res.sendFile(fileData.fileName, { root: resolve(join(paths.uploads, fileData.dirName)) });
    }
}
