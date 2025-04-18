import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UploadedFileEntity } from "./uploaded-file.entity";
import { UploadedFileRepository } from "./uploaded-file.repository";
import { UploadController } from "./upload.controller";
import { AuthController } from "./auth/auth.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'app.db',
      entities: [UploadedFileEntity],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([UploadedFileEntity]),
  ],
  controllers: [AppController, UploadController, AuthController],
  providers: [AppService, UploadedFileRepository],
})
export class AppModule {}
