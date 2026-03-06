import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsDefined, IsOptional } from 'class-validator'; // ✅ IsDefined 추가
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class CreateCharchInformationBoardDto {
  @IsString()
  @IsNotEmpty()
  @Field()
  title: string;

  @IsDefined() // ✅ 중요: 이 데코레이터가 있어야 ValidationPipe가 blocks를 허용합니다.
  @Field(() => GraphQLJSON)
  blocks: any;

  @IsString()
  @IsOptional() // ✅ IsNotEmpty 대신 IsOptional로 변경 (썸네일이 없을 수도 있음)
  @Field({ nullable: true }) // ✅ Null 허용
  thumbnailUrl?: string;
}
