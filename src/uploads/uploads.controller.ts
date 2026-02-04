// uploads/uploads.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { Express } from 'express';
import { BoardType } from './board-type.enum';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image') // ✅ 이게 핵심
  @UseInterceptors(FileInterceptor('file'))
  uploadEditorImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('boardType') boardType: BoardType, // ⭐ enum 타입으로
  ) {
    return this.uploadsService.uploadEditorImage(file, boardType);
  }
}
