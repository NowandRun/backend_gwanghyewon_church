import { Field, ObjectType, Int } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity()
export class MainPopupBoard {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Index() // ✅ 제목 검색 성능 향상을 위한 인덱스 추가 (선택)
  @Column()
  title: string;

  @Field()
  @Column()
  author: string;

  @Field(() => GraphQLJSON) // String 대신 GraphQLJSON 사용
  @Column({ type: 'json' }) // DB 타입도 json 혹은 text
  blocks: any;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.mainPopupBoard, {
    onDelete: 'CASCADE',
  })
  user: User; // ✅ 실제 작성자 연결
}
