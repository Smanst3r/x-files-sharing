import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { StorageCapacityMiddleware } from './storage-capacity.middleware';
import { UploadController } from './upload.controller';
import { ConfigModule } from '@nestjs/config';
import { AppService } from "../app.service";
import { UploadedFileRepository } from "./uploaded-file.repository";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UploadedFileEntity } from "./uploaded-file.entity";

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true}),
        TypeOrmModule.forFeature([UploadedFileEntity])
    ],
    controllers: [UploadController],
    providers: [AppService, UploadedFileRepository],
})
export class UploadModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(StorageCapacityMiddleware)
            .forRoutes('upload');
    }
}
