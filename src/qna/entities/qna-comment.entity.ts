import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { Qna } from './qna.entity';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Field, InputType, ObjectType } from '@nestjs/graphql';

@InputType('QnaCommentInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class QnaComment extends CoreEntity {
  @Field((type) => String)
  @IsString()
  @Column()
  commentOwner: string;

  @Field((type) => String)
  @IsNumber()
  @Column({ unsigned: true })
  userId: number;

  @Field((type) => String)
  @IsNotEmpty({ message: 'QNA에 대한 댓글을 작성해주세요.' })
  @IsString()
  @Column({ type: 'text' })
  comment: string;

  @Field((type) => Qna, { nullable: false })
  @ManyToOne(() => Qna, (qna) => qna.qnaComment, { nullable: false })
  qna: Qna;

  @RelationId((qnaComment: QnaComment) => qnaComment.qna)
  qnaId: number;
}
