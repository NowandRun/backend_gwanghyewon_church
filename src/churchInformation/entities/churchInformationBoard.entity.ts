import { Field, ObjectType, Int } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity()
export class ChurchInformationBoard {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Boolean, { defaultValue: false }) // GraphQL 응답용
  @Column({ default: false }) // DB 저장용
  isPinned: boolean; // ✅ 공지글 여부 추가

  @Field()
  @Column()
  title: string;

  @Field()
  @Column()
  author: string;

  @Field(() => GraphQLJSON) // String 대신 GraphQLJSON 사용
  @Column({ type: 'json' }) // DB 타입도 json 혹은 text
  blocks: any;

  // 🚀 이름을 pdfUrls -> fileUrls로 변경하여 모든 첨부파일 수용
  @Field(() => GraphQLJSON, { nullable: true })
  @Column({ type: 'json', nullable: true })
  fileUrls?: string[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.churchInformationBoard, {
    onDelete: 'CASCADE',
  })
  user: User; // ✅ 실제 작성자 연결
}
