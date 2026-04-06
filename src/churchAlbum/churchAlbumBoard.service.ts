import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { ChurchAlbumBoard } from './entities/churchAlbumBoard.entity';

import { CreateChurchAlbumBoardDto } from './dto/createChurchAlbumBoard.dto';
import { EditChurchAlbumBoardDto } from './dto/editChurchAlbumBoard.dto';
import { DeleteChurchAlbumBoardInput } from './dto/deleteChurchAlbumBoard.dto';
import { FindChurchAlbumBoardOutput } from './dto/findChurchAlbumBoard.dto';
import {
  FindAllChurchAlbumBoardOutput,
  FindAllChurchAlbumBoardPaginationInput,
} from './dto/findAllChurchAlbumBoardPagination.dto';
import { CoreOutput } from '../common/dtos/output.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ChurchAlbumBoardService {
  constructor(
    @InjectRepository(ChurchAlbumBoard)
    private readonly boardRepo: Repository<ChurchAlbumBoard>,
    private readonly uploadsService: UploadsService,
  ) {}

  /**
   * 삭제 전 S3 URL 추출: 썸네일 및 blocks 내부에 포함된 모든 S3 링크를 찾습니다.
   */
  private extractAllS3Urls(board: {
    blocks?: any;
    thumbnailUrl?: string;
  }): string[] {
    const urls: string[] = [];
    if (board.thumbnailUrl) urls.push(board.thumbnailUrl);

    if (board.blocks) {
      const contentStr =
        typeof board.blocks === 'string'
          ? board.blocks
          : JSON.stringify(board.blocks);

      // S3 URL 정규식 패턴
      const s3UrlPattern =
        /https:\/\/[a-z0-9.-]+\.s3\.[a-z0-9-]+\.amazonaws\.com\/[^"']+/g;
      const found = contentStr.match(s3UrlPattern);
      if (found) urls.push(...found);
    }
    return [...new Set(urls)]; // 중복 제거
  }

  async createChurchAlbumBoard(
    user: User,
    dto: CreateChurchAlbumBoardDto,
  ): Promise<CoreOutput> {
    try {
      // 🚀 로그인하지 않은 사용자가 어떠한 경로로든 들어왔을 경우 방어
      if (!user) {
        return { ok: false, error: '로그인이 필요한 서비스입니다.' };
      }

      const board = this.boardRepo.create({
        ...dto,
        author: user.nickname,
        user,
      });
      await this.boardRepo.save(board);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: '게시글 저장 실패' };
    }
  }

  async findAllChurchAlbumBoard({
    page,
    take,
    search, // ✅ DTO에서 search 추가됨
  }: FindAllChurchAlbumBoardPaginationInput): Promise<FindAllChurchAlbumBoardOutput> {
    try {
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
      return { ok: false, error: '데이터베이스 조회 중 오류가 발생했습니다.' };
    }
  }

  async findChurchAlbumBoardById(
    id: number,
  ): Promise<FindChurchAlbumBoardOutput> {
    try {
      // 🚀 핵심: user 관계를 명시적으로 로드합니다.
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

  async editChurchAlbumBoard(
    user: User,
    dto: EditChurchAlbumBoardDto,
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

  async deleteChurchAlbumBoard(
    user: User,
    { ids }: DeleteChurchAlbumBoardInput,
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
          board.user?.userId === user.userId ||
          user.role === UserRole.Admin ||
          user.role === UserRole.SuperAdmin,
      );

      if (!canDeleteAll)
        return {
          ok: false,
          error: '삭제 권한이 없는 게시글이 포함되어 있습니다.',
        };

      // S3 파일 삭제 처리
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
