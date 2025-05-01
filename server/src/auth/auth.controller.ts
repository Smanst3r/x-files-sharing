import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { AUTH_TOKEN_MAX_INVALID_ATTEMPTS, AUTH_TOKEN_MAX_INVALID_ATTEMPTS_HOURS, paths } from "../main";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthInvalidAttemptEntity } from "./auth-invalid-attempt.entity";
import { Repository } from "typeorm";
import { subHours } from 'date-fns';

@Controller('auth')
export class AuthController {
    constructor(
        private config: ConfigService,
        @InjectRepository(AuthInvalidAttemptEntity)
        private invalidAttemptsRepo: Repository<AuthInvalidAttemptEntity>
    ) {}

    @Post()
    async handleTokenForm(@Body('token') token: string, @Req() req: Request, @Res() res: Response) {
        // First - check if user not reached too many invalid attempts
        const ip = req.ip;
        const now = new Date();
        const existingInvalidAttempt = await this.invalidAttemptsRepo.findOne({ where: { ip } });
        if (existingInvalidAttempt) {
            const isWithinLockPeriod = new Date(existingInvalidAttempt.lastAttemptAt) > subHours(now, AUTH_TOKEN_MAX_INVALID_ATTEMPTS_HOURS);
            if (existingInvalidAttempt.attempts >= AUTH_TOKEN_MAX_INVALID_ATTEMPTS && isWithinLockPeriod) {
                return res.status(429).send('Too many invalid attempts. Try again later.');
            }
        }

        const initAuthToken: string = this.config.get('INIT_AUTH_TOKEN', '')+'';
        const savedTokens = fs.readFileSync(paths.tokensFile, 'utf-8')
            .split(/\r?\n/)
            .map(t => t.trim())
            .filter(Boolean);
        if (!savedTokens.length && !initAuthToken) {
            return res.status(500).send('The application can not function as the authentication is not properly configured.');
        }

        const tokens: string[] = !savedTokens.length ? [initAuthToken] : savedTokens;
        if (tokens.includes(token)) {
            req.session.user = {
                authenticated: true,
                uploadDir: req.sessionID,
                authedBy: 'token'
            };

            if (existingInvalidAttempt) {
                await this.invalidAttemptsRepo.remove(existingInvalidAttempt);
            }
            res.status(200).send('');
        } else {
            if (existingInvalidAttempt) {
                const shouldReset = new Date(existingInvalidAttempt.lastAttemptAt) < subHours(now, AUTH_TOKEN_MAX_INVALID_ATTEMPTS_HOURS);
                existingInvalidAttempt.attempts = shouldReset ? 1 : existingInvalidAttempt.attempts + 1;
                existingInvalidAttempt.lastAttemptAt = now;
                await this.invalidAttemptsRepo.save(existingInvalidAttempt);
            } else {
                const attempt = this.invalidAttemptsRepo.create({ ip, attempts: 1, lastAttemptAt: now });
                await this.invalidAttemptsRepo.save(attempt);
            }

            res.status(401).send('Invalid authentication token, please contact administrator to get a valid token.');
        }
    }
}
