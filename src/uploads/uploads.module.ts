import { DynamicModule, Global, Module } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { UploadModuleOptions } from './uploads.interface';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({})
@Global()
export class UploadsModule {
  static forRoot(options: UploadModuleOptions): DynamicModule {
    return {
      module: UploadsModule,
      controllers: [UploadsController],
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        UploadsService, // ⭐ 반드시 필요
      ],
      exports: [UploadsService], // 다른 모듈에서 쓸 수 있게
    };
  }
}
