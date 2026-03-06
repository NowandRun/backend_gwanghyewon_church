// boards/boards.controller.ts
import { CoreOutput } from 'src/common/dtos/output.dto';
import { CharchInformationBoardsService } from './charchinformation.service';
import { CreateCharchInformationBoardDto } from './dto/create-charchinformationboard.dto';
import { CharchInformationBoard } from './entities/charchinformationboard.entity';
import { Args, Float, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
import { AuthUser } from 'src/auth/auth-user.decorator';
import {
  FindAllCharchInformationBoardsOutput,
  FindAllCharchInformationBoardsPaginationInput,
} from './dto/find-all-charchinformationboard-pagination.dt';
import { FindCharchInformationBoardOutput } from './dto/find-charchinformationboard.dto';
import { EditCharchInformationBoardDto } from './dto/edit-charchinformationboard.dto';
import { DeleteCharchInformationBoardsInput } from './dto/delete-charchinformationboards.dto';

@Resolver(() => CharchInformationBoard)
export class CharchInformationBoardsResolver {
  constructor(private readonly boardsService: CharchInformationBoardsService) {}

  @Mutation(() => CoreOutput)
  @Role(['Any'])
  createCharchInformationBoard(
    @AuthUser() user: User,
    @Args('input') dto: CreateCharchInformationBoardDto,
  ): Promise<CoreOutput> {
    return this.boardsService.createCharchInformationBoard(user, dto);
  }

  @Query(() => FindAllCharchInformationBoardsOutput)
  findAllCharchInformationBoards(
    @Args('input')
    paginationInput: FindAllCharchInformationBoardsPaginationInput,
  ): Promise<FindAllCharchInformationBoardsOutput> {
    return this.boardsService.findAllCharchInformationBoards(paginationInput);
  }

  // 상세 조회 (이름을 프론트엔드 쿼리와 일치시킴)
  @Query(() => FindCharchInformationBoardOutput)
  findCharchInformationBoardById(
    @Args('id', { type: () => Float }) id: number,
  ) {
    return this.boardsService.findCharchInformationBoardById(id);
  }

  // 수정 뮤테이션 추가
  @Mutation(() => CoreOutput)
  @Role(['Any'])
  editCharchInformationBoard(
    @AuthUser() user: User, // ✅ 수정 권한 확인을 위해 유저 정보 추가
    @Args('input') dto: EditCharchInformationBoardDto,
  ): Promise<CoreOutput> {
    // ✅ 서비스 메서드 호출 시 user와 dto 두 개를 전달합니다.
    console.log(user, dto);
    return this.boardsService.editCharchInformationBoard(user, dto);
  }

  @Mutation(() => CoreOutput)
  @Role(['Any'])
  deleteCharchInformationBoards(
    @AuthUser() user: User,
    @Args('input') input: DeleteCharchInformationBoardsInput,
  ): Promise<CoreOutput> {
    return this.boardsService.deleteCharchInformationBoards(user, input);
  }
}
