import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { firstValueFrom, lastValueFrom, map } from 'rxjs';
import { searchBookDto } from './dtos/search-book.dto';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(private readonly httpService: HttpService) {}
  getHello(): string {
    return 'Hello World!';
  }

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

  async getLibraryList(region: number, detailRegion: number) {
    try {
      const result = await lastValueFrom(
        this.httpService.get(`http://data4library.kr/api/libSrch`, {
          params: {
            authKey: process.env.LIBRARY_BIGDATA_API_KEY,
            pageNo: 1,
            pageSize: 50,
            format: 'json',
            region: region,
            dtl_region: detailRegion,
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
}
