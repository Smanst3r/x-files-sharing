import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthInvalidAttemptEntity } from './auth-invalid-attempt.entity';
import { Repository } from 'typeorm';
import { subHours } from 'date-fns';
import { AUTH_TOKEN_MAX_INVALID_ATTEMPTS, AUTH_TOKEN_MAX_INVALID_ATTEMPTS_HOURS } from '../main';

@Injectable()
export class AuthTooManyAttemptsMiddleware implements NestMiddleware {
    constructor(
        @InjectRepository(AuthInvalidAttemptEntity)
        private invalidAttemptsRepo: Repository<AuthInvalidAttemptEntity>,
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
        const ip = req.ip;
        const now = new Date();

        // Check the number of invalid attempts for the current IP
        const existingInvalidAttempt = await this.invalidAttemptsRepo.findOne({ where: { ip } });
        if (existingInvalidAttempt) {
            const isWithinLockPeriod = new Date(existingInvalidAttempt.lastAttemptAt) > subHours(now, AUTH_TOKEN_MAX_INVALID_ATTEMPTS_HOURS);
            if (existingInvalidAttempt.attempts >= AUTH_TOKEN_MAX_INVALID_ATTEMPTS && isWithinLockPeriod) {
                return res.status(429).send('Too many invalid attempts. Try again later');
            }
        }

        next();
    }
}
