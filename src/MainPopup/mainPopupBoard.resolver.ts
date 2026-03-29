import { Args, Float, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MainPopupBoardService } from './mainPopupBoard.service';
import { MainPopupBoard } from './entities/MainPopupBoard.entity';
import { CreateMainPopupBoardDto } from './dto/createMainPopupBoard.dto';
import { EditMainPopupBoardDto } from './dto/editMainPopupBoard.dto';
import { DeleteMainPopupBoardInput } from './dto/deleteMainPopupBoard.dto';
import {
  FindAllMainPopupBoardOutput,
  FindAllMainPopupBoardPaginationInput,
} from './dto/findAllMainPopupBoardPagination.dto';
import { FindMainPopupBoardOutput } from './dto/findMainPopupBoard.dto';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Role } from 'src/auth/role.decorator';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User, UserRole } from 'src/users/entities/user.entity';

@Resolver(() => MainPopupBoard)
export class MainPopupResolver {
  constructor(private readonly boardsService: MainPopupBoardService) {}

  @Mutation(() => CoreOutput)
  @Role([UserRole.SuperAdmin, UserRole.Admin])
  createMainPopupBoard(
    @AuthUser() user: User,
    @Args('input') dto: CreateMainPopupBoardDto,
  ): Promise<CoreOutput> {
    return this.boardsService.createMainPopupBoard(user, dto);
  }

  @Query(() => FindAllMainPopupBoardOutput)
  async findAllMainPopupBoard(
    @Args('input') paginationInput: FindAllMainPopupBoardPaginationInput,
  ): Promise<FindAllMainPopupBoardOutput> {
    return this.boardsService.findAllMainPopupBoard(paginationInput);
  }

  @Query(() => FindMainPopupBoardOutput)
  findMainPopupBoardById(@Args('id', { type: () => Float }) id: number) {
    return this.boardsService.findMainPopupBoardById(id);
  }

  @Mutation(() => CoreOutput)
  @Role([UserRole.SuperAdmin, UserRole.Admin])
  editMainPopupBoard(
    @AuthUser() user: User,
    @Args('input') dto: EditMainPopupBoardDto,
  ): Promise<CoreOutput> {
    return this.boardsService.editMainPopupBoard(user, dto);
  }

  @Mutation(() => CoreOutput)
  @Role([UserRole.SuperAdmin, UserRole.Admin])
  deleteMainPopupBoard(
    @AuthUser() user: User,
    @Args('input') input: DeleteMainPopupBoardInput,
  ): Promise<CoreOutput> {
    return this.boardsService.deleteMainPopupBoard(user, input);
  }
}
