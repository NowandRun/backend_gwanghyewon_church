// boards/boards.controller.ts
import { CoreOutput } from 'src/common/dtos/output.dto';
import { ChurchBulletinBoardService } from './churchBulletinBoard.service';
import { CreateChurchBulletinBoardDto } from './dto/createCharchAlbumBoard.dto';
import { ChurchBulletinBoard } from './entities/churchBulletinBoard.entity';
import { Args, Float, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from 'src/auth/role.decorator';
import { User, UserRole } from 'src/users/entities/user.entity';
import { AuthUser } from 'src/auth/auth-user.decorator';
import {
  FindAllChurchBulletinOutput,
  FindAllChurchBulletinPaginationInput,
} from './dto/findAllCharchInAlbumBoardPagination.dto';
import { FindChurchBulletinBoardOutput } from './dto/findCharchBulletinBoard.dto';
import { EditChurchBulletinBoardDto } from './dto/editCharchAlbumBoard.dto';
import { DeleteChurchBulletinBoardInput } from './dto/deleteCharchAlbumBoards.dto';

@Resolver(() => ChurchBulletinBoard)
export class ChurchBulletinBoardResolver {
  constructor(private readonly boardsService: ChurchBulletinBoardService) {}

  @Mutation(() => CoreOutput)
  @Role([UserRole.SuperAdmin, UserRole.Admin])
  createChurchBulletinBoard(
    @AuthUser() user: User,
    @Args('input') dto: CreateChurchBulletinBoardDto,
  ): Promise<CoreOutput> {
    return this.boardsService.createChurchBulletinBoard(user, dto);
  }

  @Query(() => FindAllChurchBulletinOutput)
  findAllChurchBulletinBoard(
    @Args('input')
    paginationInput: FindAllChurchBulletinPaginationInput,
  ): Promise<FindAllChurchBulletinOutput> {
    return this.boardsService.findAllChurchBulletinBoard(paginationInput);
  }

  // 상세 조회 (이름을 프론트엔드 쿼리와 일치시킴)
  @Query(() => FindChurchBulletinBoardOutput)
  findChurchBulletinBoardById(
    @Args('id', { type: () => Float }) id: number, // Float 보다는 Int 권장
  ) {
    return this.boardsService.findChurchBulletinBoardById(id);
  }

  // 수정 뮤테이션 추가
  @Mutation(() => CoreOutput)
  @Role([UserRole.SuperAdmin, UserRole.Admin])
  editChurchBulletinBoard(
    @AuthUser() user: User, // ✅ 수정 권한 확인을 위해 유저 정보 추가
    @Args('input') dto: EditChurchBulletinBoardDto,
  ): Promise<CoreOutput> {
    // ✅ 서비스 메서드 호출 시 user와 dto 두 개를 전달합니다.
    console.log(user, dto);
    return this.boardsService.editChurchBulletinBoard(user, dto);
  }

  @Mutation(() => CoreOutput)
  @Role([UserRole.SuperAdmin, UserRole.Admin])
  deleteChurchBulletinBoard(
    @AuthUser() user: User,
    @Args('input') input: DeleteChurchBulletinBoardInput,
  ): Promise<CoreOutput> {
    return this.boardsService.deleteChurchBulletinBoard(user, input);
  }
}
