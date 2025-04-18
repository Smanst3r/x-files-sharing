import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
    constructor(private config: ConfigService) {}

    @Post()
    async handleTokenForm(@Body('token') token: string, @Req() req: Request, @Res() res: Response) {
        const tokenFilePath: string = this.config.get('TOKENS_FILE_PATH', '');
        const tokens = fs.readFileSync(tokenFilePath, 'utf-8')
            .split('\n')
            .map(t => t.trim());

        if (tokens.includes(token)) {
            req.session.user = {
                authenticated: true,
                uploadDir: req.sessionID,
            };
            res.status(200).send('');
        } else {
            res.status(401).send('Invalid token, please contact developer to get a valid token');
        }
    }
}
