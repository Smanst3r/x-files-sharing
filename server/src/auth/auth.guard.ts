import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import * as fs from "fs";

@Injectable()
export class AuthGuard implements CanActivate {
    private allowedIpsFilePath: string;

    constructor(private config: ConfigService) {
        this.allowedIpsFilePath = path.resolve(this.config.get('ALLOWED_IPS_FILE_PATH', ''));
    }

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<Request>();
        const res = context.switchToHttp().getResponse<Response>();
        const ip = req.ip ?? '';
        const allowedIps = this.getAllowedIps();

        if (req.session.user?.authenticated) {
            return true;
        }

        if (req.path.replace('\/$', '') === '/api/auth' && req.method.toLowerCase() === 'post') {
            return true;
        }

        if (allowedIps.includes(ip)) {
            return true;
        }

        res.status(401).send('Unauthorized');
        return false;
    }

    private getAllowedIps() {
        try {
            const fileContents = fs.readFileSync(this.allowedIpsFilePath, 'utf-8');
            return fileContents
                .split(/\r?\n/)
                .map((line: string) => line.trim())
                .filter(Boolean);
        } catch (err) {
            console.error('Failed to read allowed IPs:', err);
        }
        return [];
    }
}
