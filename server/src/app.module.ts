import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UploadedFileEntity } from "./uploaded-file.entity";
import { UploadedFileRepository } from "./uploaded-file.repository";
import { UploadController } from "./upload.controller";
import { AuthController } from "./auth/auth.controller";
import { CleanupModule } from "./cleanup/cleanup.module";
import { AuthInvalidAttemptEntity } from "./auth/auth-invalid-attempt.entity";
import { AuthTooManyAttemptsMiddleware } from "./auth/auth-too-many-attempts.middleware";

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true}),
        TypeOrmModule.forRoot({
            type: 'sqlite',
            database: 'app.db',
            entities: [UploadedFileEntity, AuthInvalidAttemptEntity],
            synchronize: false,
        }),
        TypeOrmModule.forFeature([UploadedFileEntity, AuthInvalidAttemptEntity]),
        CleanupModule,
    ],
    controllers: [AppController, UploadController, AuthController],
    providers: [AppService, UploadedFileRepository],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthTooManyAttemptsMiddleware).forRoutes('auth');
        consumer.apply(AuthTooManyAttemptsMiddleware).forRoutes('');
    }
}
