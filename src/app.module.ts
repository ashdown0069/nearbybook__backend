import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HttpModule } from '@nestjs/axios';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { BooksModule } from './books/books.module';
import { LibrariesModule } from './libraries/libraries.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'rate-limit',
          ttl: 60000, // 1m
          limit: 60,
          blockDuration: 60 * 60 * 1000, //1h
        },
      ],
    }),
    HttpModule.register({
      global: true,
      timeout: 5000,
      maxRedirects: 5,
      baseURL: 'http://data4library.kr/api',
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'DB.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 1000 * 60 * 30, //30 min
      max: 5000, // maximum number of items in cache,
    }),
    BooksModule,
    LibrariesModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
