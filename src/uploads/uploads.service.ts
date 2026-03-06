import { Inject, Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { BoardType } from './board-type.enum';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import * as dayjs from 'dayjs';
import { UploadsModuleOptions } from './uploads.module';

@Injectable()
export class UploadsService {
  private readonly s3: S3Client;

  constructor(
    @Inject('UPLOADS_OPTIONS')
    private readonly options: UploadsModuleOptions,
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

  // 2. ⭐ 삭제 메서드 추가
  async deleteS3File(fileUrl: string) {
    try {
      // URL에서 S3 Key(경로) 추출
      // 예: https://bucket.s3.region.amazonaws.com/boards/info/2024/01/uuid.png
      // -> boards/info/2024/01/uuid.png
      const key = fileUrl.split('.com/')[1];

      if (!key) return;

      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.options.bucket,
          Key: key,
        }),
      );
      console.log(`S3 파일 삭제 성공: ${key}`);
    } catch (error) {
      console.error('S3 파일 삭제 중 오류:', error);
      // 삭제 실패가 전체 로직을 멈추지 않게 하려면 여기서 에러를 throw하지 않거나 처리합니다.
    }
  }
}
