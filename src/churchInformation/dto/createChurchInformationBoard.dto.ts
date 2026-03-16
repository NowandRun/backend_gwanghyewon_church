import { Field, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsDefined,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator'; // ✅ IsDefined 추가
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class CreateChurchInformationBoardDto {
  @IsString()
  @IsNotEmpty()
  @Field()
  title: string;

  @IsOptional()
  @IsBoolean()
  @Field(() => Boolean, { defaultValue: false, nullable: true })
  isPinned?: boolean; // ✅ 공지글 여부 추가

  @IsDefined() // ✅ 중요: 이 데코레이터가 있어야 ValidationPipe가 blocks를 허용합니다.
  @Field(() => GraphQLJSON)
  blocks: any;

  @IsArray()
  @IsOptional()
  @Field(() => GraphQLJSON, { nullable: true })
  fileUrls?: string[]; // 👈 이미지, PDF, 문서 등 모든 S3 URL 배열
}
