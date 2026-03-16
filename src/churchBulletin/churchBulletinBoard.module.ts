import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChurchBulletinBoard } from './entities/churchBulletinBoard.entity';
import { ChurchBulletinBoardService } from './churchBulletinBoard.service';
import { ChurchBulletinBoardResolver } from './churchBulletinBoard.resolver';
import { UploadsModule } from 'src/uploads/uploads.module'; // 👈 추가

@Module({
  imports: [
    TypeOrmModule.forFeature([ChurchBulletinBoard]),
    UploadsModule, // 👈 ⭐ 이 줄을 반드시 추가해야 합니다!
  ],
  providers: [ChurchBulletinBoardService, ChurchBulletinBoardResolver],
  exports: [ChurchBulletinBoardService],
})
export class ChurchBulletinBoardModule {}
