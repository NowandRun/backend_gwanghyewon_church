import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsDefined } from 'class-validator'; // ✅ IsDefined 추가
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class CreateMainPopupBoardDto {
  @IsString()
  @IsNotEmpty()
  @Field()
  title: string;

  @IsDefined()
  @Field(() => GraphQLJSON, {
    description:
      '{ landscape: { url: string }, portrait: { url: string } } 구조로 보내주세요.',
  })
  blocks: {
    landscape: { url: string };
    portrait: { url: string };
    content?: string;
  };
}
