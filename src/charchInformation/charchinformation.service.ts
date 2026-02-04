// boards/boards.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CharchInformationBoard } from './entities/charchinformationboard.entity';
import { CreateCharchInformationBoardDto } from './dto/create-charchinformationboard.dto';
import { Args, Mutation } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Role } from 'src/auth/role.decorator';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';

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
    const board = this.boardRepo.create({
      ...dto,
      author: user.nickname,
    });

    await this.boardRepo.save(board);

    return { ok: true };
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
