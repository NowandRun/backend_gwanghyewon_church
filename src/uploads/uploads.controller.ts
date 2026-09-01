// uploads/uploads.controller.ts

import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { Express } from 'express';
import { BoardType } from './board-type.enum';
import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';

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
}
