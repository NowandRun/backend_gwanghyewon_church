import {
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CoreEntity } from 'src/common/entities/core.entity';
import { InternalServerErrorException } from '@nestjs/common';
import { IsBoolean, IsEnum, IsNumber, IsString } from 'class-validator';

// enum 값을 export로 내보냄: SetMetadata로 사용
export enum UserRole {
  Admin = 'Admin',
  Client = 'Client',
}

export enum PasswordCheakRole {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  H = 'H',
  I = 'I',
  J = 'J',
  K = 'K',
  L = 'L',
  M = 'M',
  N = 'N',
  O = 'O',
  P = 'P',
  Q = 'Q',
  R = 'R',
  S = 'S',
  T = 'T',
  U = 'U',
  V = 'V',
  W = 'W',
  X = 'X',
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

  @Column()
  @Field((type) => String)
  @IsString()
  email: string;

  @Column({ select: false })
  @Field((type) => String)
  @IsString()
  password: string;

  @Field((type) => String, { nullable: true })
  @Column()
  @IsString()
  userName?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.Client })
  @Field((type) => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Field((type) => String)
  @Column({ nullable: true, select: false })
  @IsString()
  currentRefreshToken?: string;

  @Field((type) => String)
  @Column({ nullable: true })
  @IsString()
  parish?: string;

  @Field((type) => String)
  @Column({ nullable: true })
  @IsString()
  religious?: string;

  @Field((type) => String)
  @Column({ nullable: true })
  @IsString()
  address?: string;

  @Column({ type: 'enum', enum: PasswordCheakRole })
  @Field((type) => PasswordCheakRole)
  @IsEnum(PasswordCheakRole)
  passwordCheakRole: PasswordCheakRole;

  @Field((type) => String)
  @Column()
  @IsString()
  passwordCheakFindWord: string;

  @Field((type) => Boolean)
  @Column()
  @IsBoolean()
  termsOfService: boolean;

  @Field((type) => Boolean)
  @Column()
  @IsBoolean()
  consentToCollectPersonalData: boolean;

  @Field((type) => Boolean)
  @Column()
  @IsBoolean()
  outsourcingTheProcessingOfPersonalData: boolean;

  @Field((type) => Int)
  @Column({ default: 0 })
  @IsNumber()
  numberOfLoginAttempts: number;

  @Column({ nullable: true })
  @Field((type) => Date)
  accessHistory?: Date;

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
