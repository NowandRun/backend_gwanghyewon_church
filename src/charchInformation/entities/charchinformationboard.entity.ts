import { Field, ObjectType, Int } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity()
export class CharchInformationBoard {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column()
  author: string;

  @Field(() => GraphQLJSON) // String 대신 GraphQLJSON 사용
  @Column({ type: 'json' }) // DB 타입도 json 혹은 text
  blocks: any;

  @Field({ nullable: true })
  @Column({ nullable: true })
  thumbnailUrl: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
