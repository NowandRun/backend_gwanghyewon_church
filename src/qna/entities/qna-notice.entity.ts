import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Column, Entity } from 'typeorm';
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';

@InputType('QnaInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class QnaNotice extends CoreEntity {
  @Field((type) => Int)
  @IsNumber()
  @Column({ unsigned: true })
  userId: number;

  @Field((type) => String)
  @IsString()
  @Column()
  userName: string;

  @Field((type) => String)
  @IsNotEmpty({ message: 'QNA 공지글의 제목을 입력해주세요.' })
  @IsString()
  @Column()
  title: string;

  @Field((type) => String)
  @IsNotEmpty({ message: 'QNA 공지글의 설명을 작성해주세요.' })
  @IsString()
  @Column({ type: 'text' })
  description: string;

  @Field((type) => Int)
  @IsNumber()
  @Column({ default: 0 })
  views: number;
}
