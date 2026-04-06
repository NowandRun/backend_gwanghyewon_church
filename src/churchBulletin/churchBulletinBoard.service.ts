// boards/boards.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { ChurchBulletinBoard } from './entities/churchBulletinBoard.entity';
import { CreateChurchBulletinBoardDto } from './dto/createCharchAlbumBoard.dto';
import { EditChurchBulletinBoardDto } from './dto/editCharchAlbumBoard.dto';
import { DeleteChurchBulletinBoardInput } from './dto/deleteCharchAlbumBoards.dto';
import { FindChurchBulletinBoardOutput } from './dto/findCharchBulletinBoard.dto';
import {
  FindAllChurchBulletinOutput,
  FindAllChurchBulletinPaginationInput,
} from './dto/findAllCharchInAlbumBoardPagination.dto';
import { UploadsService } from '../uploads/uploads.service';
import { User, UserRole } from '../users/entities/user.entity';
import { CoreOutput } from '../common/dtos/output.dto';

@Injectable()
export class ChurchBulletinBoardService {
  constructor(
    @InjectRepository(ChurchBulletinBoard)
    private readonly boardRepo: Repository<ChurchBulletinBoard>,
    private readonly uploadsService: UploadsService,
  ) {}

  // 공통 유틸리티: blocks 혹은 객체에서 S3 URL 추출
  private extractAllS3Urls(board: {
    blocks?: any;
    thumbnailUrl?: string;
    fileUrls?: string[];
  }): string[] {
    const urls: string[] = [];
    if (board.thumbnailUrl) urls.push(board.thumbnailUrl);
    if (board.fileUrls && Array.isArray(board.fileUrls)) {
      urls.push(...board.fileUrls);
    }

    if (board.blocks) {
      const contentStr =
        typeof board.blocks === 'string'
          ? board.blocks
          : JSON.stringify(board.blocks);
      // S3 버킷 주소 패턴 (정규식 내 변수 처리가 까다로우므로 일반적인 S3 도메인 패턴 사용)
      const s3UrlPattern =
        /https:\/\/[a-z0-9.-]+\.s3\.[a-z0-9-]+\.amazonaws\.com\/[^"']+/g;
      const found = contentStr.match(s3UrlPattern);
      if (found) urls.push(...found);
    }
    return [...new Set(urls)];
  }

  async createChurchBulletinBoard(
    user: User,
    dto: CreateChurchBulletinBoardDto,
  ): Promise<CoreOutput> {
    try {
      // 🚀 로그인하지 않은 사용자가 어떠한 경로로든 들어왔을 경우 방어
      if (!user) {
        return { ok: false, error: '로그인이 필요한 서비스입니다.' };
      }

      const board = this.boardRepo.create({
        ...dto,
        author: user.nickname,
        user, // ✅ 실제 작성자 관계 저장 (엔티티에 user 필드 필요)
      });
      await this.boardRepo.save(board);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: '게시글 저장 실패' };
    }
  }

  async findAllChurchBulletinBoard({
    page,
    take,
    search, // ✅ DTO에서 search 추가됨
  }: FindAllChurchBulletinPaginationInput): Promise<FindAllChurchBulletinOutput> {
    try {
      // 1. skip 계산 검증 (0보다 작아지지 않도록)
      const skipValue = (page - 1) * take;

      // --- 검색 조건 설정 ---
      let whereCondition: any = {};
      if (search) {
        // 제목 또는 작성자에 검색어가 포함된 경우 (OR 조건)
        whereCondition = [
          { title: ILike(`%${search}%`) },
          { author: ILike(`%${search}%`) },
        ];
      }

      const [results, totalResults] = await this.boardRepo.findAndCount({
        where: whereCondition, // ✅ 조건 적용
        skip: skipValue < 0 ? 0 : skipValue,
        take: take,
        order: { createdAt: 'DESC' },
      });
      return {
        ok: true,
        results,
        totalResults,
        totalPages: Math.ceil(totalResults / take) || 1,
      };
    } catch (error) {
      return { ok: false, error: '데이터베이스 조회 실패' };
    }
  }

  async findChurchBulletinBoardById(
    id: number,
  ): Promise<FindChurchBulletinBoardOutput> {
    try {
      const board = await this.boardRepo.findOne({
        where: { id },
        relations: ['user'],
      });
      if (!board) return { ok: false, error: '게시글을 찾을 수 없습니다.' };
      return { ok: true, result: board };
    } catch {
      return { ok: false, error: '조회 중 오류 발생' };
    }
  }

  async editChurchBulletinBoard(
    user: User,
    dto: EditChurchBulletinBoardDto,
  ): Promise<CoreOutput> {
    try {
      // 🚀 로그인하지 않은 사용자가 어떠한 경로로든 들어왔을 경우 방어
      if (!user) {
        return { ok: false, error: '로그인이 필요한 서비스입니다.' };
      }

      const board = await this.boardRepo.findOne({
        where: { id: dto.id },
        relations: ['user'],
      });
      if (!board) return { ok: false, error: '게시글을 찾을 수 없습니다.' };

      // ✅ 수정된 권한 체크 로직
      const isOwner = board.user?.id === user.id;

      // 'ADMIN' (X) -> UserRole.Admin (O)
      // SuperAdmin도 관리자이므로 함께 체크하는 것이 좋습니다.
      const isAdmin =
        user.role === UserRole.Admin || user.role === UserRole.SuperAdmin;

      if (!isOwner && !isAdmin) {
        return { ok: false, error: '권한이 없습니다.' };
      }

      // --- 🚀 S3 파일 비교 삭제 (이미지 + PDF 통합) ---
      const oldUrls = this.extractAllS3Urls(board);
      const newUrls = this.extractAllS3Urls(dto);

      const urlsToDelete = oldUrls.filter((url) => !newUrls.includes(url));
      for (const url of urlsToDelete) {
        await this.uploadsService.deleteS3File(url);
      }

      await this.boardRepo.save({ ...board, ...dto });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: '수정 중 오류 발생' };
    }
  }

  async deleteChurchBulletinBoard(
    user: User,
    { ids }: DeleteChurchBulletinBoardInput,
  ): Promise<CoreOutput> {
    try {
      // 🚀 로그인하지 않은 사용자가 어떠한 경로로든 들어왔을 경우 방어
      if (!user) {
        return { ok: false, error: '로그인이 필요한 서비스입니다.' };
      }

      const boards = await this.boardRepo.find({
        where: { id: In(ids) },
        relations: ['user'], // user 관계 추가 로드
      });

      if (boards.length === 0)
        return { ok: false, error: '삭제할 게시글이 없습니다.' };

      // 🚀 ID 기반 비교 + 관리자 예외 허용
      const canDeleteAll = boards.every(
        (board) =>
          board.user?.id === user.id ||
          user.role === UserRole.Admin ||
          user.role === UserRole.SuperAdmin,
      );

      if (!canDeleteAll)
        return {
          ok: false,
          error: '삭제 권한이 없는 게시글이 포함되어 있습니다.',
        };

      for (const board of boards) {
        const urlsToDelete = this.extractAllS3Urls(board);
        for (const url of urlsToDelete) {
          await this.uploadsService.deleteS3File(url);
        }
      }

      await this.boardRepo.delete(ids);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: '삭제 중 오류 발생' };
    }
  }
}
