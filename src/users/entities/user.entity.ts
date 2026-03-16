import {
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CoreEntity } from 'src/common/entities/core.entity';
import { InternalServerErrorException } from '@nestjs/common';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ChurchInformationBoard } from 'src/churchInformation/entities/churchInformationBoard.entity';
import { ChurchAlbumBoard } from 'src/churchAlbum/entities/churchAlbumBoard.entity';
import { ChurchBulletinBoard } from 'src/churchBulletin/entities/churchBulletinBoard.entity';

// enum 값을 export로 내보냄: SetMetadata로 사용
export enum UserRole {
  SuperAdmin = 'SuperAdmin',
  Admin = 'Admin',
  Client = 'Client',
}

export enum PasswordCheakRole {
  A = '보물 1호는?',
  B = '첫 애완동물 이름은?',
  C = '출생지는?',
  D = '어머니 성함은?',
  E = '아버지 성함은?',
  F = '초등학교 이름은?',
  G = '중학교 이름은?',
  H = '고등학교 이름은?',
  I = '대학 이름은?',
  J = '첫 직장 이름은?',
  K = '첫 자동차 모델은?',
  L = '인생 좌우명은?',
  M = '첫번째 가장 큰 목표는?',
}

registerEnumType(UserRole, { name: 'UserRole' });
registerEnumType(PasswordCheakRole, { name: 'PasswordCheakRole' });

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column({ unique: true })
  @Field((type) => String)
  @IsString()
  userId: string;

  /* @Column()
  @Field((type) => String)
  @IsString()
  email: string; */

  @Column({ select: false })
  @Field((type) => String)
  @IsString()
  password: string;

  @Column({ unique: true })
  @Field((type) => String)
  @IsString()
  nickname: string;

  @Field((type) => String, { nullable: true })
  @Column()
  @IsString()
  userName?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.Client,
  })
  @Field(() => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Field((type) => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  parish?: string;

  @Field((type) => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  religious?: string;

  @Field((type) => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  address?: string;

  @Column({ type: 'enum', enum: PasswordCheakRole })
  @Field((type) => PasswordCheakRole)
  @IsEnum(PasswordCheakRole)
  passwordCheakRole: PasswordCheakRole;

  @Field((type) => String)
  @Column()
  @IsString()
  passwordCheakFindWord: string;

  @Field((type) => Int, { nullable: true })
  @Column({ default: 0 })
  @IsNumber()
  @IsOptional()
  numberOfLoginAttempts?: number;

  @Column({ nullable: true })
  @Field((type) => Date)
  accessHistory?: Date;

  // 🚀 이 부분을 추가해야 합니다.
  @OneToMany(() => ChurchInformationBoard, (board) => board.user)
  @Field(() => [ChurchInformationBoard], { nullable: true })
  churchInformationBoard: ChurchInformationBoard[];

  @OneToMany(() => ChurchAlbumBoard, (board) => board.user)
  @Field(() => [ChurchAlbumBoard], { nullable: true })
  churchAlbumBoard: ChurchAlbumBoard[];

  @OneToMany(() => ChurchBulletinBoard, (board) => board.user)
  @Field(() => [ChurchBulletinBoard], { nullable: true })
  churchBulletinBoard: ChurchBulletinBoard[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      try {
        const saltRound = process.env.BCRYPT_SALT_ROUNDS;
        this.password = await bcrypt.hash(this.password, +saltRound);
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
