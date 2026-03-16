// boards/dto/pagination.dto.ts (없다면 생성하거나 findAll 인자로 직접 정의)
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { ChurchBulletinBoard } from '../entities/churchBulletinBoard.entity';
import { IsInt, IsOptional, Min } from 'class-validator';

@InputType()
export class FindAllChurchBulletinPaginationInput {
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
export class FindAllChurchBulletinOutput extends CoreOutput {
  @Field(() => [ChurchBulletinBoard], { nullable: true })
  results?: ChurchBulletinBoard[];

  @Field(() => Int, { nullable: true })
  totalPages?: number;

  @Field(() => Int, { nullable: true })
  totalResults?: number;
}
