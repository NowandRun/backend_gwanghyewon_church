import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CoreEntity } from 'src/common/entities/core.entity';
import { InternalServerErrorException } from '@nestjs/common';
import { IsEnum, IsString } from 'class-validator';

// enum 값을 export로 내보냄: SetMetadata로 사용
export enum UserRole {
  Manager = 'Manager',
  Client = 'Client',
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column({ unique: true })
  @Field((type) => String)
  @IsString()
  userId: string;

  @Column({ select: false })
  @Field((type) => String)
  @IsString()
  password: string;

  @Field((type) => String, { nullable: true })
  @Column()
  @IsString()
  service?: string;

  @Field((type) => String, { nullable: true })
  @Column()
  @IsString()
  userName?: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field((type) => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Field((type) => String)
  @Column({ nullable: true, select: false })
  @IsString()
  currentRefreshToken?: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
      } catch (e) {
        console.log(e);
        throw new InternalServerErrorException();
      }
    }
  }

  async checkPassword(aPassword: string): Promise<boolean> {
    try {
      const ok = await bcrypt.compare(aPassword, this.password);
      return ok;
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }
}
