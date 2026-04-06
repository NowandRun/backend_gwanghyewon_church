import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { IsBoolean } from 'class-validator';
import { User } from './user.entity';
import { CoreEntity } from '../../common/entities/core.entity';

@InputType('UserInformationConsentInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class UserInformationConsent extends CoreEntity {
  @Field((type) => Boolean)
  @Column({ default: false })
  @IsBoolean()
  termsOfService: boolean;

  @Field((type) => Boolean)
  @Column({ default: false })
  @IsBoolean()
  consentToCollectPersonalData: boolean;

  @Field((type) => Boolean)
  @Column({ default: false })
  @IsBoolean()
  outsourcingTheProcessingOfPersonalData: boolean;

  @OneToOne((type) => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
