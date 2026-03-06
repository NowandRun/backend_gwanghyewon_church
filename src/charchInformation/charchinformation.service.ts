// boards/boards.service.ts (또는 charchinformation.service.ts)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CharchInformationBoard } from './entities/charchinformationboard.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from 'src/users/entities/user.entity';
import { CreateCharchInformationBoardDto } from './dto/create-charchinformationboard.dto';
import {
  FindAllCharchInformationBoardsOutput,
  FindAllCharchInformationBoardsPaginationInput,
} from './dto/find-all-charchinformationboard-pagination.dt';
import { FindCharchInformationBoardOutput } from './dto/find-charchinformationboard.dto';
import { EditCharchInformationBoardDto } from './dto/edit-charchinformationboard.dto';
import { DeleteCharchInformationBoardsInput } from './dto/delete-charchinformationboards.dto';
import { UploadsService } from 'src/uploads/uploads.service';

@Injectable()
export class CharchInformationBoardsService {
  constructor(
    @InjectRepository(CharchInformationBoard)
    private readonly boardRepo: Repository<CharchInformationBoard>,
    private readonly uploadsService: UploadsService, // ✅ 의존성 주입 추가
  ) {}

  async createCharchInformationBoard(
    user: User,
    dto: CreateCharchInformationBoardDto,
  ): Promise<CoreOutput> {
    try {
      const board = this.boardRepo.create({
        title: dto.title,
        author: user.nickname,
        blocks: dto.blocks,
        thumbnailUrl: dto.thumbnailUrl ?? null,
      });

      await this.boardRepo.save(board);
      return { ok: true };
    } catch (error) {
      console.error('저장 에러:', error);
      return { ok: false, error: '게시글 저장 실패' };
    }
  }

  // 전체 조회: 가공 없이 그대로 반환
  async findAllCharchInformationBoards({
    page,
    take,
  }: FindAllCharchInformationBoardsPaginationInput): Promise<FindAllCharchInformationBoardsOutput> {
    try {
      // 1. skip 계산 검증 (0보다 작아지지 않도록)
      const skipValue = (page - 1) * take;

      const [results, totalResults] = await this.boardRepo.findAndCount({
        skip: skipValue < 0 ? 0 : skipValue,
        take: take,
        order: { createdAt: 'DESC' },
      });

      // 2. 데이터 유무 로그 확인 (서버 콘솔에서 확인용)
      console.log(`조회 결과: ${results.length}건 / 총: ${totalResults}건`);

      return {
        ok: true,
        results,
        totalResults,
        totalPages: Math.ceil(totalResults / take) || 1, // 최소 1페이지 보장
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
  async findCharchInformationBoardById(
    id: number,
  ): Promise<FindCharchInformationBoardOutput> {
    try {
      const board = await this.boardRepo.findOneBy({ id });
      if (!board) {
        return { ok: false, error: '게시글을 찾을 수 없습니다.' };
      }
      return { ok: true, result: board };
    } catch {
      return { ok: false, error: '조회 중 오류 발생' };
    }
  }

  async editCharchInformationBoard(
    user: User,
    dto: EditCharchInformationBoardDto,
  ): Promise<CoreOutput> {
    try {
      // 1. 기존 게시글 찾기 (수정 전 데이터를 가져옴)
      const board = await this.boardRepo.findOne({ where: { id: dto.id } });
      if (!board) return { ok: false, error: '게시글을 찾을 수 없습니다.' };

      // 2. 작성자 본인 확인
      if (board.author !== user.nickname) {
        return { ok: false, error: '본인이 작성한 글만 수정할 수 있습니다.' };
      }

      // --- 🚀 [추가] S3 이미지 비교 삭제 로직 ---

      // (1) 기존 데이터와 새 데이터에서 이미지 URL 추출 함수
      const extractUrls = (content: any): string[] => {
        if (!content) return [];
        const contentStr =
          typeof content === 'string' ? content : JSON.stringify(content);
        const s3UrlPattern = new RegExp(
          `https://${this.uploadsService['options'].bucket}.s3.${this.uploadsService['options'].region}.amazonaws.com/[^"']+`,
          'g',
        );
        return contentStr.match(s3UrlPattern) || [];
      };

      const oldUrls = [
        ...extractUrls(board.blocks),
        ...(board.thumbnailUrl ? [board.thumbnailUrl] : []),
      ];
      const newUrls = [
        ...extractUrls(dto.blocks),
        ...(dto.thumbnailUrl ? [dto.thumbnailUrl] : []),
      ];

      // (2) 기존에는 있었지만 새 데이터에는 없는 URL 필터링 (삭제 대상)
      const urlsToDelete = oldUrls.filter((url) => !newUrls.includes(url));

      // (3) S3에서 실제 삭제 실행
      for (const url of urlsToDelete) {
        await this.uploadsService.deleteS3File(url);
        console.log(`수정으로 인해 제외된 이미지 삭제: ${url}`);
      }

      // --- 🚀 로직 끝 ---

      // 3. 업데이트 로직 수행
      await this.boardRepo.save({
        ...board,
        ...dto,
      });

      return { ok: true };
    } catch (error) {
      console.error('수정 에러:', error);
      return { ok: false, error: '수정 중 오류가 발생했습니다.' };
    }
  }

  async deleteCharchInformationBoards(
    user: User,
    { ids }: DeleteCharchInformationBoardsInput,
  ): Promise<CoreOutput> {
    try {
      const boards = await this.boardRepo.find({ where: { id: In(ids) } });
      if (boards.length === 0)
        return { ok: false, error: '삭제할 게시글이 없습니다.' };

      const isAllMine = boards.every((board) => board.author === user.nickname);
      if (!isAllMine)
        return { ok: false, error: '본인 게시글만 삭제할 수 있습니다.' };

      for (const board of boards) {
        // [1] 썸네일 삭제
        if (board.thumbnailUrl) {
          await this.uploadsService.deleteS3File(board.thumbnailUrl);
        }

        // [2] 본문(blocks) 내 모든 이미지 삭제
        if (board.blocks) {
          try {
            // blocks가 문자열인지 객체인지 확인 후 처리
            const blocksStr =
              typeof board.blocks === 'string'
                ? board.blocks
                : JSON.stringify(board.blocks);

            // 정규식을 사용하여 본문 내의 모든 S3 URL 추출
            // 사용자의 S3 버킷 주소 패턴에 맞춰 추출합니다.
            const s3UrlPattern = new RegExp(
              `https://${this.uploadsService['options'].bucket}.s3.${this.uploadsService['options'].region}.amazonaws.com/[^"']+`,
              'g',
            );

            const foundUrls = blocksStr.match(s3UrlPattern);

            if (foundUrls && foundUrls.length > 0) {
              console.log(
                `${board.id}번 게시글에서 ${foundUrls.length}개의 본문 이미지 발견`,
              );

              // 발견된 모든 URL에 대해 삭제 실행
              for (const url of foundUrls) {
                // 썸네일과 중복되지 않는 경우에만 삭제 (이미 위에서 지웠을 수 있으므로)
                if (url !== board.thumbnailUrl) {
                  await this.uploadsService.deleteS3File(url);
                }
              }
            }
          } catch (e) {
            console.error(`본문 이미지 추출 실패 (ID: ${board.id}):`, e);
          }
        }
      }

      // [3] DB 레코드 삭제
      await this.boardRepo.delete(ids);

      return { ok: true };
    } catch (error) {
      console.error('삭제 처리 중 에러:', error);
      return { ok: false, error: '삭제 처리 중 오류가 발생했습니다.' };
    }
  }
}
