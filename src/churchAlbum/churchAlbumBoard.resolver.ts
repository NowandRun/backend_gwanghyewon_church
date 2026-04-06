import { Args, Float, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ChurchAlbumBoardService } from './churchAlbumBoard.service';
import { ChurchAlbumBoard } from './entities/churchAlbumBoard.entity';
import { CreateChurchAlbumBoardDto } from './dto/createChurchAlbumBoard.dto';
import { EditChurchAlbumBoardDto } from './dto/editChurchAlbumBoard.dto';
import { DeleteChurchAlbumBoardInput } from './dto/deleteChurchAlbumBoard.dto';
import {
  FindAllChurchAlbumBoardOutput,
  FindAllChurchAlbumBoardPaginationInput,
} from './dto/findAllChurchAlbumBoardPagination.dto';
import { FindChurchAlbumBoardOutput } from './dto/findChurchAlbumBoard.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { CoreOutput } from '../common/dtos/output.dto';
import { AuthUser } from '../auth/auth-user.decorator';
import { Role } from '../auth/role.decorator';

@Resolver(() => ChurchAlbumBoard)
export class ChurchAlbumBoardResolver {
  constructor(private readonly boardsService: ChurchAlbumBoardService) {}

  @Mutation(() => CoreOutput)
  @Role([UserRole.SuperAdmin, UserRole.Admin])
  createChurchAlbumBoard(
    @AuthUser() user: User,
    @Args('input') dto: CreateChurchAlbumBoardDto,
  ): Promise<CoreOutput> {
    return this.boardsService.createChurchAlbumBoard(user, dto);
  }

  @Query(() => FindAllChurchAlbumBoardOutput)
  async findAllChurchAlbumBoard(
    @Args('input') paginationInput: FindAllChurchAlbumBoardPaginationInput,
  ): Promise<FindAllChurchAlbumBoardOutput> {
    return this.boardsService.findAllChurchAlbumBoard(paginationInput);
  }

  @Query(() => FindChurchAlbumBoardOutput)
  findChurchAlbumBoardById(@Args('id', { type: () => Float }) id: number) {
    return this.boardsService.findChurchAlbumBoardById(id);
  }

  @Mutation(() => CoreOutput)
  @Role([UserRole.SuperAdmin, UserRole.Admin])
  editChurchAlbumBoard(
    @AuthUser() user: User,
    @Args('input') dto: EditChurchAlbumBoardDto,
  ): Promise<CoreOutput> {
    return this.boardsService.editChurchAlbumBoard(user, dto);
  }

  @Mutation(() => CoreOutput)
  @Role([UserRole.SuperAdmin, UserRole.Admin])
  deleteChurchAlbumBoard(
    @AuthUser() user: User,
    @Args('input') input: DeleteChurchAlbumBoardInput,
  ): Promise<CoreOutput> {
    return this.boardsService.deleteChurchAlbumBoard(user, input);
  }
}
