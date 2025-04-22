import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from "@nestjs/platform-express";
import * as cookieParser from 'cookie-parser';
import * as fileStoreFactory from 'session-file-store';
const session = require('express-session');
import { ConfigService } from "@nestjs/config";
import { join, resolve } from "path";
import * as fs from "fs";
import { AuthGuard } from "./auth/auth.guard";
import { Logger, RequestMethod } from "@nestjs/common";

// Setup application root paths
const rootPath = resolve(join(__dirname, '..'));
export const paths = {
    root: rootPath,
    allowedIpsFile: resolve(join(rootPath, 'db-data', 'allowed_ip_addresses.txt')),
    tokensFile: resolve(rootPath, 'db-data', 'tokens.txt'),
    uploads: resolve(rootPath, 'uploads'),
}

export const AUTH_TOKEN_MAX_INVALID_ATTEMPTS = 5;
export const AUTH_TOKEN_MAX_INVALID_ATTEMPTS_HOURS = 1; // per hour

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const FileStore = fileStoreFactory(session);
    const config = app.get(ConfigService);
    const logger = new Logger('Bootstrap');

    if (!config.get('INIT_ALLOWED_IP')) {
        logger.error('Please set required INIT_ALLOWED_IP environment variable. Application closed');
        return await app.close();
    }
    if (!config.get('INIT_AUTH_TOKEN')) {
        logger.error('Please set required INIT_AUTH_TOKEN environment variable. Application closed');
        return await app.close();
    }

    const staticPath = resolve(join(rootPath, 'public'));
    if (!fs.existsSync(staticPath)) {
        fs.mkdirSync(staticPath);
    }
    app.useStaticAssets(staticPath);
    app.setBaseViewsDir(staticPath);

    app.use(cookieParser());

    app.useGlobalGuards(new AuthGuard(config));
    app.setGlobalPrefix('api', {
        exclude: [
            { path: 'share/:token', method: RequestMethod.GET },
            { path: 'download/:fileId', method: RequestMethod.GET },
        ],
    });
    app.enableCors({
        origin: 'http://localhost:5173', // allow local frontend access
        credentials: true,
    });

    const sessionLifetime = parseInt(config.get('SESSION_LIFETIME_DAYS', '7'), 10) * 24 * 60 * 60;
    let sessionSecret = config.get('SESSION_SECRET');
    if (!sessionSecret) {
        sessionSecret = 'dummy_session_secret!';
        logger.warn('Please set the SESSION_SECRET environment variable to better protect your session data');
    }

    const sessionDir = resolve(join(rootPath, 'sessions'));
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir);
    }
    app.use(
        session({
            store: new FileStore({
                path: sessionDir,
                ttl: sessionLifetime
            }),
            secret: sessionSecret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: sessionLifetime * 1000,
                // secure: process.env.NODE_ENV === 'production',
                secure: false, // site currently is on http only
                httpOnly: true,
            },
        }),
    );

    const uploadsDir = paths.uploads;
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }

    const tokensFilePath = paths.tokensFile;
    if (!fs.existsSync(tokensFilePath)) {
        try {
            fs.writeFileSync(tokensFilePath, '');
        } catch (err) {
            logger.error(err);
        }
    }

    const allowedIpsFilePath = paths.allowedIpsFile;
    if (!fs.existsSync(allowedIpsFilePath)) {
        try {
            fs.writeFileSync(allowedIpsFilePath, '');
        } catch (err) {
            logger.error(err);
        }
    }

    await app.listen(3333);
}

bootstrap();
