// boards/dto/pagination.dto.ts (없다면 생성하거나 findAll 인자로 직접 정의)
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { ChurchInformationBoard } from '../entities/churchInformationBoard.entity';
import { IsInt, IsOptional, Min } from 'class-validator';

@InputType()
export class FindAllChurchInformationBoardPaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1) // 페이지는 1부터 시작해야 함
  page: number;

  @Field(() => Int, { defaultValue: 9 })
  @IsOptional()
  @IsInt()
  @Min(1)
  take: number;
}

@ObjectType()
export class FindAllChurchInformationBoardOutput extends CoreOutput {
  @Field(() => [ChurchInformationBoard], { nullable: true })
  results?: ChurchInformationBoard[];

  @Field(() => Int, { nullable: true })
  totalPages?: number;

  @Field(() => Int, { nullable: true })
  totalResults?: number;
}
