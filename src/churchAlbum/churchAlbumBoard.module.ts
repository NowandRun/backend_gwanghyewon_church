import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChurchAlbumBoard } from './entities/churchAlbumBoard.entity';
import { ChurchAlbumBoardService } from './churchAlbumBoard.service';
import { ChurchAlbumBoardResolver } from './churchAlbumBoard.resolver';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChurchAlbumBoard]),
    UploadsModule, // 👈 ⭐ 이 줄을 반드시 추가해야 합니다!
  ],
  providers: [ChurchAlbumBoardService, ChurchAlbumBoardResolver],
  exports: [ChurchAlbumBoardService],
})
export class ChurchAlbumBoardsModule {}
