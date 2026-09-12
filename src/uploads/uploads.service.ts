import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { BoardType } from './board-type.enum';
import { extname, join } from 'path';
import * as fs from 'fs';
import dayjs from 'dayjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadsService {
  private readonly MAX_DAILY_UPLOADS = 50; // 🚀 하루 제한 설정
  private readonly uploadBasePath: string;
  // 🚀 2GB 용량 제한 설정 (Bytes)
  private readonly MAX_TOTAL_STORAGE_BYTES = 2 * 1024 * 1024 * 1024;

  constructor(
    @Inject('UPLOADS_OPTIONS')
    private readonly configService: ConfigService, // 주입
  ) {
    // 100% .env 파일에서만 경로를 가져오도록 설정
    const envUploadPath = this.configService.get<string>('UPLOAD_PATH');

    // .env에 UPLOAD_PATH 설정이 빠져있을 경우 예외를 던져 앱 실행 단계에서 명확히 알립니다.
    if (!envUploadPath) {
      throw new InternalServerErrorException(
        '환경변수 UPLOAD_PATH가 설정되지 않았습니다. .env 파일을 확인해 주세요.',
      );
    }

    this.uploadBasePath = envUploadPath;
  }

  // 관리자용 저장 공간 조회 메서드
  async getStorageStatus() {
    const usedBytes = this.getDirectorySize(this.uploadBasePath);
    const maxBytes = this.MAX_TOTAL_STORAGE_BYTES;
    const remainingBytes = Math.max(0, maxBytes - usedBytes);
    const usagePercentage = Number(((usedBytes / maxBytes) * 100).toFixed(1));

    return {
      usedBytes,
      maxBytes,
      remainingBytes,
      // 프론트엔드에서 바로 보여줄 수 있도록 단위 변환 데이터 제공 (MB, GB)
      usedMB: Number((usedBytes / (1024 * 1024)).toFixed(2)),
      maxGB: Number((maxBytes / (1024 * 1024 * 1024)).toFixed(1)),
      usagePercentage, // 사용률 (%)
    };
  }

  async uploadFile(file: Express.Multer.File, boardType: BoardType) {
    // 1. 현재 저장소의 전체 사용량 계산
    const currentStorageSize = this.getDirectorySize(this.uploadBasePath);

    // 2. 새 파일 추가 시 2GB를 초과하는지 검사
    if (currentStorageSize + file.size > this.MAX_TOTAL_STORAGE_BYTES) {
      throw new BadRequestException(
        `할당된 최대 저장 용량(2GB)을 초과할 수 없습니다. 현재 사용량: ${(currentStorageSize / (1024 * 1024)).toFixed(1)}MB`,
      );
    }

    const decodedName = decodeURIComponent(file.originalname);
    const extension = extname(decodedName).toLowerCase();
    const datePath = dayjs().format('YYYY/MM/DD');

    // 1. 파일명 중복을 피하기 위해 고유 ID 추가
    const uniqueFileName = `${Date.now()}_${decodedName}`;

    // 폴더 분류 로직
    let folder = 'others';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) folder = 'images';
    else if (extension === '.pdf') folder = 'pdfs';

    // 홈서버 대상 디렉터리 경로 (/app/uploads/boards/{boardType}/{YYYY/MM/DD}/{folder})
    const targetDir = join(this.uploadBasePath, 'boards', boardType, datePath, folder);
    const relativePath = `boards/${boardType}/${datePath}/${folder}/${uniqueFileName}`;
    const filePath = join(targetDir, uniqueFileName);

    // 🚀 1. 하루 전체 업로드 개수 제한 체크 (홈서버 디렉터리 탐색)
    try {
      const todayBaseDir = join(this.uploadBasePath, 'boards');
      let todayUploadCount = 0;

      // 오늘 날짜 경로에 존재하는 모든 파일 개수 집계
      if (fs.existsSync(todayBaseDir)) {
        todayUploadCount = this.countTodayFiles(todayBaseDir, datePath);
      }

      if (todayUploadCount >= this.MAX_DAILY_UPLOADS) {
        throw new BadRequestException(
          `하루 업로드 제한(${this.MAX_DAILY_UPLOADS}개)을 초과했습니다. 내일 다시 시도해주세요.`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('로컬 파일 개수 체크 중 오류:', error);
    }

    // 2. 중복 파일 체크 로직 (동일 경로 존재 여부 확인)
    if (fs.existsSync(filePath)) {
      throw new BadRequestException(
        `이미 동일한 이름의 파일이 해당 날짜 경로에 존재합니다: ${decodedName}`,
      );
    }

    // 3. 파일 저장 실행 (디렉터리 생성 및 파일 쓰기)
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.writeFileSync(filePath, file.buffer);

      return {
        url: `https://wavenexusforwebsite.serveirc.com/uploads/${relativePath}`,
      };
    } catch (error) {
      console.error(error);
      throw new Error('홈서버 파일 업로드 중 오류가 발생했습니다.');
    }
  }

  // 4. 파일 삭제 메서드 (기존 deleteS3File과 동일한 인터페이스 유지)
  async deleteFile(fileUrl: string) {
    try {
      if (!fileUrl) return;

      const baseUrl = 'https://wavenexusforwebsite.serveirc.com/uploads/';
      const relativePath = fileUrl.includes(baseUrl)
        ? fileUrl.split(baseUrl)[1]
        : fileUrl.split('/uploads/')[1];

      if (!relativePath) return;

      const filePath = join(this.uploadBasePath, relativePath);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`홈서버 파일 삭제 성공: ${relativePath}`);
      }
    } catch (error) {
      console.error('홈서버 파일 삭제 중 오류:', error);
    }
  }

  // 폴더 내부의 모든 파일 용량을 재귀적으로 합산하는 헬퍼 메서드
  private getDirectorySize(dirPath: string): number {
    let totalSize = 0;
    if (!fs.existsSync(dirPath)) return 0;

    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
      const fullPath = join(dirPath, item.name);
      if (item.isDirectory()) {
        totalSize += this.getDirectorySize(fullPath);
      } else if (item.isFile()) {
        totalSize += fs.statSync(fullPath).size;
      }
    }
    return totalSize;
  }

  // 오늘 날짜(YYYY/MM/DD)에 해당하는 업로드 파일 수를 재귀적으로 계산하는 헬퍼 메서드
  private countTodayFiles(dirPath: string, datePath: string): number {
    let count = 0;
    if (!fs.existsSync(dirPath)) return 0;

    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
      const fullPath = join(dirPath, item.name);
      if (item.isDirectory()) {
        count += this.countTodayFiles(fullPath, datePath);
      } else if (item.isFile() && fullPath.includes(datePath)) {
        count++;
      }
    }
    return count;
  }
}
