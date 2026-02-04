import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharchInformationBoard } from './entities/charchinformationboard.entity';
import { CharchInformationBoardsService } from './charchinformation.service';
import { CharchInformationBoardsResolver } from './charchinformationboards.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([CharchInformationBoard])],
  providers: [
    CharchInformationBoardsService,
    CharchInformationBoardsResolver, // ✅ 반드시 필요
  ],
})
export class CharchInformationBoardsModule {}
