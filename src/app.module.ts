import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { JwtModule } from './jwt/jwt.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from './common/common.module';
/* import { RedisModule } from '@liaoliaots/nestjs-redis'; */
import GraphQLJSON from 'graphql-type-json';
import { ChurchAlbumBoardsModule } from './churchAlbum/churchAlbumBoard.module';
import { ChurchInformationBoardsModule } from './churchInformation/churchInformationBoard.module';
import { ChurchBulletinBoardModule } from './churchBulletin/churchBulletinBoard.module';
import { MainPopupBoardsModule } from './MainPopup/mainPopupBoard.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'production', 'test').required(),
        DB_TYPE: Joi.string().required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        BCRYPT_SALT_ROUNDS: Joi.number().default(10),
        PRIVATE_KEY: Joi.string().required(),
        PRIVATE_KEY_EXPIRES_IN: Joi.string().required(),

        // REDIS (미사용 시 optional)
        REDIS_HOST: Joi.string().optional(),
        REDIS_PORT: Joi.number().optional(),
        REDIS_PASSWORD: Joi.string().allow('').optional(),

        // AWS S3 ✅
        AWS_REGION: Joi.string().optional(),
        AWS_BUCKET: Joi.string().optional(),
        AWS_ACCESS_KEY_ID: Joi.string().optional(),
        AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: config.get<string>('DB_TYPE') as any,
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        synchronize: false, // 👈 초기 배포 및 테이블 생성을 위해 true로 설정
        logging: true, // 👈 DB 쿼리 생성을 확인하기 위해 true 추천
        autoLoadEntities: true,
        migrations: ['dist/migrations/*.js'],
        migrationsRun: true,
      }),
    }),
    /*  RedisModule.forRoot({
      readyLog: process.env.NODE_ENV !== 'production',
      config: {
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT,
        password:
          process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.length > 0
            ? process.env.REDIS_PASSWORD
            : undefined,
      },
    }), */
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      installSubscriptionHandlers: true,
      resolvers: { JSON: GraphQLJSON },
      // Http 통신시 사용
      context: ({ req, extra }) => {
        return { token: req ? req.headers['x-jwt'] : extra.token };
      },
    }),
    ScheduleModule.forRoot(),
    JwtModule.forRoot({
      privateKey: process.env.PRIVATE_KEY,
      privateKeyExpiresIn: process.env.PRIVATE_KEY_EXPIRES_IN,
    }),
    /* S3UploadsModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        bucket: config.get('AWS_BUCKET'),
        region: config.get('AWS_REGION'),
        accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY'),
      }),
      inject: [ConfigService],
    }), */
    UploadsModule,
    UsersModule,
    AuthModule,
    CommonModule,
    ChurchInformationBoardsModule,
    ChurchAlbumBoardsModule,
    ChurchBulletinBoardModule,
    MainPopupBoardsModule,
  ],
  controllers: [],
  providers: [ConfigService],
})
export class AppModule {}
