import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { firstValueFrom, lastValueFrom, map } from 'rxjs';
import { searchBookDto } from './dtos/search-book.dto';
import { getDateRange } from './utils';
import { Cacheable } from './decorator/cache.decorator';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}
  getHello(): string {
    return 'Hello World!';
  }

  //삭제예정
  async sendMessageToDiscord(
    title: string,
    description: string,
    type: 'Error' | 'Feedback' | 'Alert',
    feedbackEmail?: string,
  ) {
    feedbackEmail = feedbackEmail ?? '없음'; // feedbackEmail이 undefined 또는 null이면 'test'를 할당
    const colorMap = {
      Error: 16711680,
      Feedback: 255,
      Alert: 16776960,
    };
    const discordWebHookURL = process.env.DISCORD_WEBHOOK_URL;
    try {
      await lastValueFrom(
        this.httpService
          .post(discordWebHookURL, {
            embeds: [
              {
                title: type + ': ' + title,
                description: description,
                color: colorMap[type],
                timestamp: new Date().toISOString(),
                footer: {
                  text: 'Email: ' + feedbackEmail,
                },
              },
            ],
          })
          .pipe(map((res) => res.data)),
      );
    } catch (error) {
      this.logger.error('sendMessageToDiscord service error', error);
      return false;
    }

    return true;
  }

  //삭제예정
  async getBooks(
    mode: searchBookDto['mode'],
    query: searchBookDto['query'],
    pageNo: searchBookDto['pageNo'] = 1,
  ) {
    let params;
    if (mode === 'title') {
      params = {
        title: query.trim().replace(/ /g, ''),
      };
    } else if (mode === 'isbn') {
      if (!/^[0-9]{13}$/.test(query)) {
        throw new BadRequestException('Invalid ISBN format');
      }
      params = {
        isbn13: parseInt(query),
      };
    } else {
      throw new BadRequestException('Invalid search mode');
    }

    try {
      const result = await firstValueFrom(
        this.httpService.get(`http://data4library.kr/api/srchBooks`, {
          params: {
            ...params,
            authKey: process.env.LIBRARY_BIGDATA_API_KEY,
            pageSize: 12,
            sort: 'pubYear',
            order: 'desc',
            format: 'json',
            pageNo,
            exactMatch: true,
          },
        }),
      );

      const response = result.data.response;
      if (!response || !response.docs) {
        return {
          pages: 0,
          books: [],
          numFound: 0,
        };
      }

      const foundBooks = response.numFound;
      const pageSize = 12;
      const pages = Math.ceil(foundBooks / pageSize);
      const books = response.docs.map((item) => item.doc);
      const responseWithPages = {
        pages: pages,
        books: books,
        numFound: foundBooks,
      };

      return responseWithPages;
    } catch (error) {
      this.logger.error('getBooks service error', error);
      this.sendMessageToDiscord(
        'getBooks service error',
        JSON.stringify(error),
        'Error',
      );
      throw new InternalServerErrorException('can not get book list');
    }
  }

  //삭제예정
  async getRegionLibraryList(region: number) {
    try {
      const result = await lastValueFrom(
        this.httpService.get(`http://data4library.kr/api/libSrch`, {
          params: {
            authKey: process.env.LIBRARY_BIGDATA_API_KEY,
            pageNo: 1,
            pageSize: 500,
            format: 'json',
            region: region,
          },
        }),
      );

      // return result.data;
      return result.data.response.libs.map((lib) => lib.lib);
    } catch (error) {
      this.logger.error('getRegionLibraryList service error', error);
      this.sendMessageToDiscord(
        'getRegionLibraryList service error',
        JSON.stringify(error),
        'Error',
      );
      throw new InternalServerErrorException('can not get library list');
    }
  }

  //삭제예정
  @Cacheable({
    ttl: 1000 * 60 * 60, // 1 hour
    customKey: (args) => `libs${args[0]}${args[1]}`,
  })
  async getLibraryList(region: number, detailRegion?: number) {
    let obj = {};
    if (detailRegion) {
      obj = {
        dtl_region: detailRegion,
      };
    }
    try {
      const result = await lastValueFrom(
        this.httpService.get(`http://data4library.kr/api/libSrch`, {
          params: {
            authKey: process.env.LIBRARY_BIGDATA_API_KEY,
            pageNo: 1,
            pageSize: 50,
            format: 'json',
            region: region,
            ...obj,
          },
        }),
      );

      return result.data.response.libs.map((lib) => lib.lib);
    } catch (error) {
      this.logger.error('getLibraryList service error', error);
      this.sendMessageToDiscord(
        'getLibraryListByISBN service error',
        JSON.stringify(error),
        'Error',
      );
      throw new InternalServerErrorException('can not get library list');
    }
  }

  //삭제예정
  @Cacheable({
    ttl: 1000 * 60 * 60, // 1 hour
    customKey: (args) => `libs_with_ISBN${args[0]}`,
  })
  async getLibraryListByISBN(
    ISBN: number,
    region: number,
    detailRegion: number,
  ) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`http://data4library.kr/api/libSrchByBook`, {
          params: {
            authKey: process.env.LIBRARY_BIGDATA_API_KEY,
            isbn: ISBN,
            region: region,
            pageSize: 50,
            format: 'json',
            ...(detailRegion && {
              dtl_region: detailRegion,
            }),
          },
        }),
      );

      if (response.data.response.libs.length > 0) {
        return response.data.response.libs.map((lib) => lib.lib);
      } else {
        return [];
      }
    } catch (error) {
      this.logger.error('getLibraryListByISBN service error', error);
      this.sendMessageToDiscord(
        'getLibraryListByISBN service error',
        JSON.stringify(error),
        'Error',
      );
      throw new InternalServerErrorException('can not get library list');
    }
  }

  //삭제예정
  async getBookLoanStatus(isbn: number, libCode: number) {
    if (isbn.toString().length !== 13) {
      throw new BadRequestException('Invalid ISBN format');
    }
    try {
      const response = await lastValueFrom(
        this.httpService.get(`http://data4library.kr/api/bookExist`, {
          params: {
            authKey: process.env.LIBRARY_BIGDATA_API_KEY,
            isbn13: isbn,
            libCode: libCode,
            format: 'json',
          },
        }),
      );
      return response.data.response.result;
    } catch (error) {
      this.logger.error('getBookLoanStatus service error', error);
      this.sendMessageToDiscord(
        'getBookLoanStatus service error',
        JSON.stringify(error),
        'Error',
      );
      throw new InternalServerErrorException('can not get loan status');
    }
  }

  //삭제예정
  @Cacheable({
    ttl: 1000 * 60 * 60 * 12, // 12 hour
    customKey: () => `popularLoanBooks`,
  })
  async getPopularLoanBooks() {
    const { startDate, endDate } = getDateRange(1);

    try {
      const result = await lastValueFrom(
        this.httpService.get(`http://data4library.kr/api/loanItemSrch`, {
          params: {
            authKey: process.env.LIBRARY_BIGDATA_API_KEY,
            startDt: startDate,
            endDt: endDate,
            format: 'json',
            pageNo: 1,
            pageSize: 10,
          },
        }),
      );
      const books = result.data.response.docs.map((item) => item.doc);

      return books;
    } catch (error) {
      this.logger.error('getPopularLoanBooks service error', error);
      this.sendMessageToDiscord(
        'getPopularLoanBooks service error',
        JSON.stringify(error),
        'Error',
      );
      throw new InternalServerErrorException('can not get PopularLoanBooks');
    }
  }

  //삭제예정
  async getBooksByAuthor(query: string, pageNo: searchBookDto['pageNo'] = 1) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`http://data4library.kr/api/srchBooks`, {
          params: {
            author: query.trim().toLowerCase().replace(/ /g, ''),
            authKey: process.env.LIBRARY_BIGDATA_API_KEY,
            pageSize: 12,
            sort: 'pubYear',
            order: 'desc',
            format: 'json',
            pageNo,
            exactMatch: true,
          },
        }),
      );

      const response = result.data.response;
      if (!response || !response.docs) {
        return {
          pages: 0,
          books: [],
          numFound: 0,
        };
      }

      const foundBooks = response.numFound;
      const pageSize = 12;
      const pages = Math.ceil(foundBooks / pageSize);
      const books = response.docs.map((item) => item.doc);
      const responseWithPages = {
        pages: pages,
        books: books,
        numFound: foundBooks,
      };

      return responseWithPages;
    } catch (error) {
      this.logger.error('getBooksByTitle service error', error);
      this.sendMessageToDiscord(
        'getBooksByTitle service error',
        JSON.stringify(error),
        'Error',
      );
      throw new InternalServerErrorException('can not get book list');
    }
  }

  //삭제예정
  async getBooksByTitle(query: string, pageNo: searchBookDto['pageNo'] = 1) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`http://data4library.kr/api/srchBooks`, {
          params: {
            title: query.trim().toLowerCase().replace(/ /g, ''),
            authKey: process.env.LIBRARY_BIGDATA_API_KEY,
            pageSize: 12,
            sort: 'pubYear',
            order: 'desc',
            format: 'json',
            pageNo,
            exactMatch: true,
          },
        }),
      );

      const response = result.data.response;
      if (!response || !response.docs) {
        return {
          pages: 0,
          books: [],
          numFound: 0,
        };
      }

      const foundBooks = response.numFound;
      const pageSize = 12;
      const pages = Math.ceil(foundBooks / pageSize);
      const books = response.docs.map((item) => item.doc);
      const responseWithPages = {
        pages: pages,
        books: books,
        numFound: foundBooks,
      };

      return responseWithPages;
    } catch (error) {
      this.logger.error('getBooksByTitle service error', error);
      this.sendMessageToDiscord(
        'getBooksByTitle service error',
        JSON.stringify(error),
        'Error',
      );
      throw new InternalServerErrorException('can not get book list');
    }
  }
}
