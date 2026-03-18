// boards/boards.service.ts (또는 charchinformation.service.ts)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { ChurchInformationBoard } from './entities/churchInformationBoard.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User, UserRole } from 'src/users/entities/user.entity';
import { CreateChurchInformationBoardDto } from './dto/createChurchInformationBoard.dto';
import {
  FindAllChurchInformationBoardOutput,
  FindAllChurchInformationBoardPaginationInput,
} from './dto/findAllChurchInformationBoardPagination.dt';
import { FindChurchInformationBoardOutput } from './dto/findChurchInformationBoard.dto';
import { EditChurchInformationBoardDto } from './dto/editChurchInformationBoard.dto';
import { DeleteChurchInformationBoardInput } from './dto/deleteChurchInformationBoard.dto';
import { UploadsService } from 'src/uploads/uploads.service';

@Injectable()
export class ChurchInformationBoardService {
  constructor(
    @InjectRepository(ChurchInformationBoard)
    private readonly boardRepo: Repository<ChurchInformationBoard>,
    private readonly uploadsService: UploadsService, // ✅ 의존성 주입 추가
  ) {}

  private extractAllS3Urls(board: {
    blocks?: any;
    fileUrls?: string[];
  }): string[] {
    const urls: string[] = [];
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

  async createChurchInformationBoard(
    user: User,
    dto: CreateChurchInformationBoardDto,
  ): Promise<CoreOutput> {
    try {
      // 🚀 로그인하지 않은 사용자가 어떠한 경로로든 들어왔을 경우 방어
      if (!user) {
        return { ok: false, error: '로그인이 필요한 서비스입니다.' };
      }

      const board = this.boardRepo.create({
        ...dto,
        author: user.nickname, // 표시용 닉네임
        user, // ✅ 실제 작성자 관계 저장 (엔티티에 user 필드 필요)
      });
      await this.boardRepo.save(board);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: '게시글 저장 실패' };
    }
  }

  // 전체 조회: 가공 없이 그대로 반환
  async findAllChurchInformationBoard({
    page,
    take,
    search, // ✅ DTO에서 search 추가됨
  }: FindAllChurchInformationBoardPaginationInput): Promise<FindAllChurchInformationBoardOutput> {
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
        order: {
          isPinned: 'DESC',
          createdAt: 'DESC',
        },
      });

      return {
        ok: true,
        results,
        totalResults,
        totalPages: Math.ceil(totalResults / take) || 1,
      };
    } catch (error) {
      console.error('조회 에러:', error);
      return {
        ok: false,
        error: '데이터베이스 조회 중 오류가 발생했습니다.',
      };
    }
  }

  // 상세 조회 수정
  async findChurchInformationBoardById(
    id: number,
  ): Promise<FindChurchInformationBoardOutput> {
    try {
      // 🚀 핵심: user 관계를 명시적으로 로드합니다.
      const board = await this.boardRepo.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!board) {
        return { ok: false, error: '게시글을 찾을 수 없습니다.' };
      }
      return { ok: true, result: board };
    } catch (error) {
      return { ok: false, error: '조회 중 오류 발생' };
    }
  }

  async editChurchInformationBoard(
    user: User,
    dto: EditChurchInformationBoardDto,
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

      // ... (S3 처리 및 저장 로직)
      await this.boardRepo.save({ ...board, ...dto });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: '수정 중 오류 발생' };
    }
  }

  async deleteChurchInformationBoard(
    user: User,
    { ids }: DeleteChurchInformationBoardInput,
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
