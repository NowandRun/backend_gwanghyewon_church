// uploads/uploads.controller.ts

import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { BoardType } from './board-type.enum';
import { Body, Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('file') // ✅ 이게 핵심
  @UseInterceptors(FileInterceptor('file'))
  uploadEditorImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('boardType') boardType: BoardType, // ⭐ enum 타입으로
  ) {
    return this.uploadsService.uploadFile(file, boardType);
  }

  @Get('storage-status')
  async getStorageStatus() {
    return await this.uploadsService.getStorageStatus();
  }
}
