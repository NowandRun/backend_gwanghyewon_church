// boards/boards.controller.ts
import { CoreOutput } from 'src/common/dtos/output.dto';
import { CharchInformationBoardsService } from './charchinformation.service';
import { CreateCharchInformationBoardDto } from './dto/create-charchinformationboard.dto';
import { CharchInformationBoard } from './entities/charchinformationboard.entity';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
import { AuthUser } from 'src/auth/auth-user.decorator';

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

  @Query(() => [CharchInformationBoard], {
    name: 'findAllCharchInformationBoards',
  })
  findAll() {
    return this.boardsService.findAllCharchInformationBoards();
  }

  @Query(() => CharchInformationBoard)
  findOne(@Args('id') id: string) {
    return this.boardsService.findOneCharchInformationBoard(+id);
  }
}
