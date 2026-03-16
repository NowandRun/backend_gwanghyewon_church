import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsDefined, IsOptional } from 'class-validator'; // ✅ IsDefined 추가
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class CreateChurchAlbumBoardDto {
  @IsString()
  @IsNotEmpty()
  @Field()
  title: string;

  @IsDefined() // ✅ 중요: 이 데코레이터가 있어야 ValidationPipe가 blocks를 허용합니다.
  @Field(() => GraphQLJSON)
  blocks: any;

  @IsString()
  @IsNotEmpty()
  @Field()
  thumbnailUrl: string;
}
