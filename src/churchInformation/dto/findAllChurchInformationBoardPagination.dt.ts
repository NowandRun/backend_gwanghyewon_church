import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { ChurchInformationBoard } from '../entities/churchInformationBoard.entity';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class FindAllChurchInformationBoardPaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int, { defaultValue: 12 }) // 프런트엔드 takeAmount와 맞춤
  @IsOptional()
  @IsInt()
  @Min(1)
  take: number;

  // --- 검색 필드 추가 ---
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
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
