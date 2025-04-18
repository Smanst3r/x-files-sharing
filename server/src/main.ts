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
import { RequestMethod } from "@nestjs/common";

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const FileStore = fileStoreFactory(session);
    const config = app.get(ConfigService);
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        const staticPath = join(__dirname, 'public');
        app.useStaticAssets(staticPath);
        app.setBaseViewsDir(staticPath);
    } else {
        app.useStaticAssets(join(__dirname, '..', '..', 'client', 'dist'));
        app.setBaseViewsDir(join(__dirname, '..', '..', 'client', 'dist'));
    }

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
    const sessionSecret = config.get('SESSION_SECRET');
    if (!sessionSecret) {
        throw new Error('Mandatory SESSION_SECRET is missing in .env');
    }

    const sessionDir = resolve(__dirname, '..', 'sessions');
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

    if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads');
    }

    await app.listen(3333);
}

bootstrap();
