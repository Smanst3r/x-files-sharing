import { Module } from '@nestjs/common';
import { CleanupService } from './cleanup.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { UploadedFileEntity } from "../upload/uploaded-file.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UploadedFileEntity])],
  providers: [CleanupService],
})
export class CleanupModule {}
