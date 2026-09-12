// src/uploads/uploads.module.ts

import { DynamicModule, Global, Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';

export interface S3UploadsModuleOptions {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

@Global()
@Module({})
export class S3UploadsModule {
  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => S3UploadsModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      global: true,
      module: S3UploadsModule,
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
