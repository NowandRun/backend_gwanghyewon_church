// src/uploads/uploads.module.ts

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';

@Global()
@Module({
  imports: [ConfigModule], // 👈 ConfigService 사용을 위한 모듈 등록
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
