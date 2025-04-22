import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from "fs";
import { paths } from "../main";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly logger = new Logger(AuthGuard.name);

    constructor(private config: ConfigService) {}

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
            if (!req.session.user) {
                req.session.user = {
                    authenticated: true,
                    uploadDir: req.sessionID,
                };
            }
            return true;
        } else {
            this.logger.debug(`IP :: ${ip} is not whitelisted`);
        }

        res.status(401).send('Unauthorized');
        return false;
    }

    private getAllowedIps(): string[] {
        let r: string[] = [];
        try {
            const fileContents = fs.readFileSync(paths.allowedIpsFile, 'utf-8');
            r = fileContents
                .split(/\r?\n/)
                .map((line: string) => line.trim())
                .filter(Boolean);
        } catch (err) {
            this.logger.error(err);
        }

        return [...r, '127.0.0.1', this.config.get('INIT_ALLOWED_IP') as string];
    }
}
