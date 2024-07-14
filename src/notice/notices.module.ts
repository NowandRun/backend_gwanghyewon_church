import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notice } from './entities/notice.entity';
import { NoticeResolver } from './notices.resolver';
import { NoticeService } from './notices.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notice]), UsersModule],
  providers: [NoticeResolver, NoticeService],
})
export class NoticeModule {}
