import { Inject, Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { UploadModuleOptions } from './uploads.interface';
import { BoardType } from './board-type.enum';
import { Express } from 'express';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import * as dayjs from 'dayjs';

@Injectable()
export class UploadsService {
  private readonly s3: S3Client;

  constructor(
    @Inject(CONFIG_OPTIONS)
    private readonly options: UploadModuleOptions,
  ) {
    this.s3 = new S3Client({
      region: options.region,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async uploadEditorImage(file: Express.Multer.File, boardType: BoardType) {
    const key = `boards/${boardType}/${dayjs().format(
      'YYYY/MM',
    )}/${uuid()}${extname(file.originalname)}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      url: `https://${this.options.bucket}.s3.${this.options.region}.amazonaws.com/${key}`,
    };
  }
}
