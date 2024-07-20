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
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { User } from './users/entities/user.entity';
import { JwtModule } from './jwt/jwt.module';
import { AuthModule } from './auth/auth.module';
import { QnaModule } from './qna/qnas.module';
import { Qna } from './qna/entities/qna.entity';
import { QnaComment } from './qna/entities/qna-comment.entity';
import { Notice } from './notice/entities/notice.entity';
import { NoticeModule } from './notice/notices.module';
import { JwtMiddleware } from './jwt/jwt.middleware';

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
        REFRESHTOKEN_PRIVATE_KEY: Joi.string().required(),
        ACCESSTOKEN_PRIVATE_KEY: Joi.string().required(),
        ACCESSTOKEN_EXPIRESIN: Joi.string().required(),
        REFRESHTOKEN_EXPIRESIN: Joi.string().required(),
        BCRYPT_SALT_ROUNDS: Joi.string().required(),
        ACCESSTOKEN_HTTP_ONLY: Joi.boolean().required(),
        ACCESSTOKEN_SAMESITE: Joi.required(),
        ACCESSTOKEN_SECURE: Joi.boolean().required(),
        ACCESSTOKEN_MAX_AGE: Joi.number().required(),
        REFRESHTOKEN_HTTP_ONLY: Joi.boolean().required(),
        REFRESHTOKEN_SAMESITE: Joi.required(),
        REFRESHTOKEN_SECURE: Joi.boolean().required(),
        REFRESHTOKEN_MAX_AGE: Joi.number().required(),
        ACCESSTOKEN_LOGOUT_MAX_AGE: Joi.number().required(),
        REFRESHTOKEN_LOGOUT_MAX_AGE: Joi.number().required(),
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
      synchronize: process.env.NODE_ENV !== 'prod',
      logging:
        process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'test',
      entities: [User, Qna, QnaComment, Notice],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      context: ({ req, res, connection }) => {
        return {
          req,
          res,
        };
      },
    }),
    JwtModule.forRoot({
      accessTokenPrivateKey: process.env.ACCESSTOKEN_PRIVATE_KEY,
      refreshTokenPrivateKey: process.env.REFRESHTOKEN_PRIVATE_KEY,
      accessTokenExpiresIn: process.env.ACCESSTOKEN_EXPIRESIN,
      refreshTokenExpiresIn: process.env.REFRESHTOKEN_EXPIRESIN,
    }),
    UsersModule,
    AuthModule,
    QnaModule,
    NoticeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes({ path: '/graphql', method: RequestMethod.POST });
  }
}
