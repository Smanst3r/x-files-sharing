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

        if (req.session.user?.authenticated) {
            return true;
        }

        if (req.path.replace('\/$', '') === '/api/auth' && req.method.toLowerCase() === 'post') {
            return true;
        }

        if (ip === '127.0.0.1') {
            return true;
        }
        let allowedIps = this.getAllowedIps();
        if (!allowedIps.length) {
            const initAllowedIp = this.config.get('INIT_ALLOWED_IP') as string;
            if (!initAllowedIp) {
                this.logger.error('The authentication is not properly configured. env variable INIT_ALLOWED_IP is not set');
                res.status(500).send('The application can not function as the authentication is not properly configured.');
                return false;
            } else {
                allowedIps = [initAllowedIp];
            }
        }

        if (allowedIps.includes(ip)) {
            if (!req.session.user) {
                req.session.user = {
                    authenticated: true,
                    uploadDir: req.sessionID,
                    authedBy: 'ip',
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

        return r;
    }
}
