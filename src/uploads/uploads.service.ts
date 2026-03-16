import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { BoardType } from './board-type.enum';
import { extname } from 'path';
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

  async uploadFile(file: Express.Multer.File, boardType: BoardType) {
    const decodedName = decodeURIComponent(file.originalname);
    const extension = extname(decodedName).toLowerCase();

    let folder = 'others';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension))
      folder = 'images';
    else if (extension === '.pdf') folder = 'pdfs';

    const datePath = dayjs().format('YYYY/MM/DD');
    const s3Key = `boards/${boardType}/${datePath}/${folder}/${decodedName}`;

    // 🚀 [추가] 중복 파일 체크 로직
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.options.bucket,
          Key: s3Key,
        }),
      );
      // HeadObjectCommand가 성공하면 파일이 존재한다는 뜻입니다.
      throw new BadRequestException(
        `이미 동일한 이름의 파일이 해당 날짜 경로에 존재합니다: ${decodedName}`,
      );
    } catch (error) {
      // 파일이 없을 경우 NotFound(404) 에러가 발생하며, 이는 정상적인 업로드 흐름입니다.
      // 하지만 위에서 던진 BadRequestException은 그대로 통과시켜야 합니다.
      if (error instanceof BadRequestException) throw error;

      // 404 에러 이외의 다른 에러(권한 등)가 발생한 경우 체크
      if (error['$metadata']?.httpStatusCode !== 404) {
        console.error('S3 체크 중 오류:', error);
      }
    }

    // 파일이 존재하지 않을 때만 아래 업로드 로직 실행
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.options.bucket,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(decodedName)}`,
        }),
      );

      return {
        url: `https://${this.options.bucket}.s3.${this.options.region}.amazonaws.com/${s3Key}`,
      };
    } catch (error) {
      console.error(error);
      throw new Error('S3 업로드 중 오류가 발생했습니다.');
    }
  }

  async deleteS3File(fileUrl: string) {
    try {
      if (!fileUrl) return;

      // URL에서 Key 추출 (더 안전한 방식)
      const bucketUrl = `${this.options.bucket}.s3.${this.options.region}.amazonaws.com/`;
      const key = fileUrl.includes(bucketUrl)
        ? fileUrl.split(bucketUrl)[1]
        : fileUrl.split('.com/')[1];

      if (!key) return;

      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.options.bucket,
          Key: key,
        }),
      );
      console.log(`S3 파일 삭제 성공: ${key}`);
    } catch (error) {
      // 삭제 실패가 비즈니스 로직에 영향을 주지 않도록 로깅만 수행
      console.error('S3 파일 삭제 중 오류:', error);
    }
  }
}
