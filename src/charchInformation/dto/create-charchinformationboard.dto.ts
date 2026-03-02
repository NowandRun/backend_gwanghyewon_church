import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsDefined } from 'class-validator'; // ✅ IsDefined 추가
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
  @IsNotEmpty() // ✅ 썸네일도 스키마상 필수(String!)이므로 체크 필요
  @Field()
  thumbnailUrl: string;
}
