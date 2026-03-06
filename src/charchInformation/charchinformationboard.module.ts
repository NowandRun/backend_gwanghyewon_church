import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharchInformationBoard } from './entities/charchinformationboard.entity';
import { CharchInformationBoardsService } from './charchinformation.service';
import { CharchInformationBoardsResolver } from './charchinformationboards.resolver';
import { UploadsModule } from 'src/uploads/uploads.module'; // 👈 추가

@Module({
  imports: [
    TypeOrmModule.forFeature([CharchInformationBoard]),
    UploadsModule, // 👈 ⭐ 이 줄을 반드시 추가해야 합니다!
  ],
  providers: [CharchInformationBoardsService, CharchInformationBoardsResolver],
  exports: [CharchInformationBoardsService],
})
export class CharchInformationBoardsModule {}
