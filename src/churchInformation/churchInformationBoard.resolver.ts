// boards/boards.controller.ts
import { ChurchInformationBoardService } from './churchInformationBoard.service';
import { CreateChurchInformationBoardDto } from './dto/createChurchInformationBoard.dto';
import { ChurchInformationBoard } from './entities/churchInformationBoard.entity';
import { Args, Float, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  FindAllChurchInformationBoardOutput,
  FindAllChurchInformationBoardPaginationInput,
} from './dto/findAllChurchInformationBoardPagination.dt';
import { FindChurchInformationBoardOutput } from './dto/findChurchInformationBoard.dto';
import { EditChurchInformationBoardDto } from './dto/editChurchInformationBoard.dto';
import { DeleteChurchInformationBoardInput } from './dto/deleteChurchInformationBoard.dto';
import { Role } from '../auth/role.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { CoreOutput } from '../common/dtos/output.dto';
import { AuthUser } from '../auth/auth-user.decorator';

@Resolver(() => ChurchInformationBoard)
export class ChurchInformationBoardResolver {
  constructor(private readonly boardsService: ChurchInformationBoardService) {}

  @Mutation(() => CoreOutput)
  @Role([UserRole.SuperAdmin, UserRole.Admin])
  async createChurchInformationBoard(
    @AuthUser() user: User,
    @Args('input') dto: CreateChurchInformationBoardDto,
  ): Promise<CoreOutput> {
    return this.boardsService.createChurchInformationBoard(user, dto);
  }

  @Query(() => FindAllChurchInformationBoardOutput)
  async findAllChurchInformationBoard(
    // ✅ async 추가 (일관성)
    @Args('input')
    paginationInput: FindAllChurchInformationBoardPaginationInput,
  ): Promise<FindAllChurchInformationBoardOutput> {
    // paginationInput 내부에 이제 search 필드가 포함되어 서비스로 전달됩니다.
    return this.boardsService.findAllChurchInformationBoard(paginationInput);
  }

  // 상세 조회 (이름을 프론트엔드 쿼리와 일치시킴)
  @Query(() => FindChurchInformationBoardOutput)
  async findChurchInformationBoardById(
    @Args('id', { type: () => Float }) id: number,
  ): Promise<FindChurchInformationBoardOutput> {
    // 🚀 서비스에서 Relation을 포함해 가져오도록 서비스 코드를 먼저 수정해야 합니다.
    return this.boardsService.findChurchInformationBoardById(id);
  }

  @Mutation(() => CoreOutput)
  @Role([UserRole.SuperAdmin, UserRole.Admin])
  async editChurchInformationBoard(
    @AuthUser() user: User,
    @Args('input') dto: EditChurchInformationBoardDto,
  ): Promise<CoreOutput> {
    // ✅ 서비스 메서드 호출 시 user와 dto 두 개를 전달합니다.
    console.log(user, dto);
    return this.boardsService.editChurchInformationBoard(user, dto);
  }

  @Mutation(() => CoreOutput)
  @Role([UserRole.SuperAdmin, UserRole.Admin])
  async deleteChurchInformationBoard(
    @AuthUser() user: User,
    @Args('input') input: DeleteChurchInformationBoardInput,
  ): Promise<CoreOutput> {
    return this.boardsService.deleteChurchInformationBoard(user, input);
  }
}
