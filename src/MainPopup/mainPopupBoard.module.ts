import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MainPopupBoard } from './entities/MainPopupBoard.entity';
import { MainPopupBoardService } from './mainPopupBoard.service';
import { MainPopupResolver } from './mainPopupBoard.resolver';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [TypeOrmModule.forFeature([MainPopupBoard]), UploadsModule],
  providers: [MainPopupBoardService, MainPopupResolver],
  exports: [MainPopupBoardService],
})
export class MainPopupBoardsModule {}
