import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UploadedFileEntity } from "./upload/uploaded-file.entity";
import { UploadedFileRepository } from "./upload/uploaded-file.repository";
import { AuthController } from "./auth/auth.controller";
import { CleanupModule } from "./cleanup/cleanup.module";
import { AuthInvalidAttemptEntity } from "./auth/auth-invalid-attempt.entity";
import { AuthTooManyAttemptsMiddleware } from "./auth/auth-too-many-attempts.middleware";
import { join, resolve } from "path";
import { UploadModule } from "./upload/upload.module";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true}),
        ScheduleModule.forRoot(),
        TypeOrmModule.forRoot({
            type: 'sqlite',
            database: resolve(join(__dirname, '..', 'db-data', 'app.db')),
            entities: [UploadedFileEntity, AuthInvalidAttemptEntity],
            synchronize: false,
        }),
        TypeOrmModule.forFeature([UploadedFileEntity, AuthInvalidAttemptEntity]),
        CleanupModule,
        UploadModule,
    ],
    controllers: [AppController, AuthController],
    providers: [AppService, UploadedFileRepository],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthTooManyAttemptsMiddleware).forRoutes('auth');
        consumer.apply(AuthTooManyAttemptsMiddleware).forRoutes('');
    }
}
