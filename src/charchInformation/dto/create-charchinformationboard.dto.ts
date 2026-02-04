// boards/dto/create-board.dto.ts
import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateCharchInformationBoardDto {
  @IsString()
  @Field()
  @IsNotEmpty()
  title: string;

  @IsString()
  @Field()
  content: string;

  @IsOptional()
  @IsString()
  @Field()
  thumbnailUrl?: string;
}
