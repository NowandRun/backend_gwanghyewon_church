// boards/boards.service.ts (또는 charchinformation.service.ts)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CharchInformationBoard } from './entities/charchinformationboard.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from 'src/users/entities/user.entity';
import { CreateCharchInformationBoardDto } from './dto/create-charchinformationboard.dto';

@Injectable()
export class CharchInformationBoardsService {
  constructor(
    @InjectRepository(CharchInformationBoard)
    private readonly boardRepo: Repository<CharchInformationBoard>,
  ) {}

  async createCharchInformationBoard(
    user: User,
    dto: CreateCharchInformationBoardDto,
  ): Promise<CoreOutput> {
    try {
      const board = this.boardRepo.create({
        title: dto.title,
        author: user.nickname,
        blocks: dto.blocks, // ✅ dto.content 대신 dto.blocks 사용
        thumbnailUrl: dto.thumbnailUrl ?? null,
      });

      await this.boardRepo.save(board);
      return { ok: true };
    } catch (error) {
      console.error('저장 에러:', error);
      return { ok: false, error: '게시글 저장 실패' };
    }
  }

  findAllCharchInformationBoards() {
    return this.boardRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  findOneCharchInformationBoard(id: number) {
    return this.boardRepo.findOneBy({ id });
  }
}
