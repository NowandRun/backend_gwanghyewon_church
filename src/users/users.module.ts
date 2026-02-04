import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { ConfigModule } from '@nestjs/config';
import { UserInformationConsent } from './entities/user-information-consent.entity';
import { AdminSeedService } from './adminModuleInit.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserInformationConsent]),
    ConfigModule,
  ],
  providers: [UsersResolver, UsersService, AdminSeedService],
  exports: [UsersService],
})
export class UsersModule {}
