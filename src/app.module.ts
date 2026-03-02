import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
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
import { CharchInformationBoardsModule } from './charchInformation/charchinformationboard.module';
import { UploadsModule } from './uploads/uploads.module';
import GraphQLJSON from 'graphql-type-json';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'production', 'test').required(),
        DB_HOST: Joi.string(),
        DB_PORT: Joi.string(),
        DB_USERNAME: Joi.string().required(),
        DB_NAME: Joi.string(),
        DB_PASSWORD: Joi.string(),
        BCRYPT_SALT_ROUNDS: Joi.number().default(10),
        PRIVATE_KEY: Joi.string().required(),
        PRIVATE_KEY_EXPIRES_IN: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.string().required(),
        REDIS_PASSWORD: Joi.string().allow('').optional(),

        // AWS S3 ✅
        AWS_REGION: Joi.string().required(),
        AWS_BUCKET: Joi.string().required(),
        AWS_ACCESS_KEY_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(process.env.DATABASE_URL
        ? { url: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST,
            port: +process.env.DB_PORT,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
          }),
      synchronize: process.env.NODE_ENV !== 'production',
      logging:
        process.env.NODE_ENV !== 'production' &&
        process.env.NODE_ENV !== 'test',
      autoLoadEntities: true,
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

    UploadsModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        bucket: config.get('AWS_BUCKET'),
        region: config.get('AWS_REGION'),
        accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY'),
      }),
      inject: [ConfigService],
    }),

    UsersModule,
    AuthModule,
    /*     QnaModule,
    NoticeModule, */
    CommonModule,
    CharchInformationBoardsModule,
  ],
  controllers: [],
  providers: [ConfigService],
})
export class AppModule {}
