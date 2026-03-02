// src/uploads/uploads.module.ts

import { DynamicModule, Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';

export interface UploadsModuleOptions {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

@Module({})
export class UploadsModule {
  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => UploadsModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: UploadsModule,
      imports: options.imports,
      controllers: [UploadsController], // 👈 이거 추가
      providers: [
        {
          provide: 'UPLOADS_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        UploadsService,
      ],
      exports: [UploadsService],
    };
  }
}
