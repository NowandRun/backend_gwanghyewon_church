import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChurchInformationBoard } from './entities/churchInformationBoard.entity';
import { ChurchInformationBoardService } from './churchInformationBoard.service';
import { ChurchInformationBoardResolver } from './churchInformationBoard.resolver';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChurchInformationBoard]),
    UploadsModule, // 👈 ⭐ 이 줄을 반드시 추가해야 합니다!
  ],
  providers: [ChurchInformationBoardService, ChurchInformationBoardResolver],
  exports: [ChurchInformationBoardService],
})
export class ChurchInformationBoardsModule {}
