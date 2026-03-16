import { Field, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsDefined,
  IsOptional,
  IsArray,
} from 'class-validator'; // ✅ IsDefined 추가
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class CreateChurchBulletinBoardDto {
  @IsString()
  @IsNotEmpty()
  @Field()
  title: string;

  @IsDefined() // ✅ 중요: 이 데코레이터가 있어야 ValidationPipe가 blocks를 허용합니다.
  @Field(() => GraphQLJSON)
  blocks: any;

  @IsArray()
  @IsOptional()
  @Field(() => GraphQLJSON, { nullable: true })
  fileUrls?: string[]; // 👈 이미지, PDF, 문서 등 모든 S3 URL 배열

  @IsString()
  @IsNotEmpty()
  @Field()
  thumbnailUrl: string;
}
