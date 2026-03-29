// boards/dto/pagination.dto.ts (없다면 생성하거나 findAll 인자로 직접 정의)
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { MainPopupBoard } from '../entities/MainPopupBoard.entity';

@InputType()
export class FindAllMainPopupBoardPaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1) // 페이지는 1부터 시작해야 함
  page: number;

  @Field(() => Int, { defaultValue: 12 })
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
export class FindAllMainPopupBoardOutput extends CoreOutput {
  @Field(() => [MainPopupBoard], { nullable: true })
  results?: MainPopupBoard[];

  @Field(() => Int, { nullable: true })
  totalPages?: number;

  @Field(() => Int, { nullable: true })
  totalResults?: number;
}
