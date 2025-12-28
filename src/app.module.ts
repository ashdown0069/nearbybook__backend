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
import * as https from 'https';
import * as http from 'http';
import CacheableLookup from 'cacheable-lookup';

const cacheable = new CacheableLookup();

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 200,
  maxFreeSockets: 20,
  maxTotalSockets: 200,
  scheduling: 'lifo',
  timeout: 20000, // connection timeout
  keepAliveMsecs: 1000,
});
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 200,
  maxFreeSockets: 20,
  maxTotalSockets: 200,
  scheduling: 'lifo',
  timeout: 20000, // connection timeout
  keepAliveMsecs: 1000,
});

cacheable.install(httpAgent);
cacheable.install(httpsAgent);
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
      maxRedirects: 5,
      timeout: 20000,
      baseURL: 'http://data4library.kr/api',
      httpAgent,
      httpsAgent,
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
