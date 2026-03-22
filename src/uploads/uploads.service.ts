import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { BoardType } from './board-type.enum';
import { extname } from 'path';
import * as dayjs from 'dayjs';
import { UploadsModuleOptions } from './uploads.module';

@Injectable()
export class UploadsService {
  private readonly s3: S3Client;
  private readonly MAX_DAILY_UPLOADS = 50; // 🚀 하루 제한 설정

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
    const datePath = dayjs().format('YYYY/MM/DD');

    // 🚀 [추가] 1. 하루 전체 업로드 개수 제한 체크
    // 'boards/' 경로 아래 오늘 날짜(YYYY/MM/DD)로 시작하는 모든 객체를 조회합니다.
    const listCommand = new ListObjectsV2Command({
      Bucket: this.options.bucket,
      Prefix: `boards/`, // 전체 게시판 기준 혹은 특정 경로 기준
    });

    try {
      const objects = await this.s3.send(listCommand);
      // 오늘 날짜 경로가 포함된 파일들만 필터링하여 카운트
      const todayFiles =
        objects.Contents?.filter((obj) => obj.Key?.includes(datePath)) || [];

      if (todayFiles.length >= this.MAX_DAILY_UPLOADS) {
        throw new BadRequestException(
          `하루 업로드 제한(${this.MAX_DAILY_UPLOADS}개)을 초과했습니다. 내일 다시 시도해주세요.`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('S3 개수 체크 중 오류:', error);
    }

    // 폴더 분류 로직
    let folder = 'others';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension))
      folder = 'images';
    else if (extension === '.pdf') folder = 'pdfs';

    const s3Key = `boards/${boardType}/${datePath}/${folder}/${decodedName}`;

    // 2. 중복 파일 체크 로직 (기존 유지)
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.options.bucket,
          Key: s3Key,
        }),
      );
      throw new BadRequestException(
        `이미 동일한 이름의 파일이 해당 날짜 경로에 존재합니다: ${decodedName}`,
      );
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error['$metadata']?.httpStatusCode !== 404) {
        console.error('S3 체크 중 오류:', error);
      }
    }

    // 3. 파일 업로드 실행
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
