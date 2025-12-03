import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AppService } from 'src/app.service';
import { HttpService } from '@nestjs/axios';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { searchBooksDto } from './dto/req/search-books.dto';
import { searchBookDto } from './dto/req/search-book.dto';
import { CommonService } from 'src/common/common.service';
import { formatDate, getDateRange } from 'src/utils';

@Injectable()
export class BooksService {
  private readonly logger = new Logger(AppService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async searchBook(isbn: searchBookDto['isbn']) {
    const result = await firstValueFrom(
      this.httpService.get(`/srchDtlList`, {
        params: {
          isbn13: isbn,
          authKey: process.env.LIBRARY_BIGDATA_API_KEY,
          loaninfoYN: 'Y',
          displayInfo: 'age',
          format: 'json',
        },
      }),
    );

    return result.data;
  }
  async searchBooks(
    mode: searchBooksDto['mode'],
    query: searchBooksDto['query'],
    pageNo: searchBooksDto['pageNo'] = 1,
  ) {
    let params;
    if (mode === 'title') {
      params = {
        title: query,
      };
    } else if (mode === 'isbn') {
      params = {
        isbn13: parseInt(query),
      };
    }

    try {
      const result = await firstValueFrom(
        this.httpService.get(`/srchBooks`, {
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
      this.commonService.sendMessageToDiscord(
        'getBooks service error',
        JSON.stringify(error),
        'Error',
      );
      throw new InternalServerErrorException('can not get book list');
    }
  }

  async getTrendingBooks() {
    const currentDate = formatDate(new Date());
    console.log('currentDate', currentDate);
    const result = await lastValueFrom(
      this.httpService.get(`/hotTrend`, {
        params: {
          authKey: process.env.LIBRARY_BIGDATA_API_KEY,
          format: 'json',
          searchDt: currentDate,
        },
      }),
    );

    const books = result.data.response.results.flatMap((item) =>
      item.result.docs.map((d) => d.doc),
    );

    //중복제거, 최대 7개 선택
    const filteredBooks = [
      ...new Map(books.map((item) => [item.isbn13, item])).values(),
    ].slice(0, 7);

    return filteredBooks;
  }

  async getPopularLoanBooks() {
    const { startDate, endDate } = getDateRange(1);

    try {
      const result = await lastValueFrom(
        this.httpService.get(`/loanItemSrch`, {
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
      this.commonService.sendMessageToDiscord(
        'getPopularLoanBooks service error',
        JSON.stringify(error),
        'Error',
      );
      throw new InternalServerErrorException('can not get PopularLoanBooks');
    }
  }

  async getBookLoanStatus(isbn: string, libCode: number) {
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
      this.commonService.sendMessageToDiscord(
        'getBookLoanStatus service error',
        JSON.stringify(error),
        'Error',
      );
      throw new InternalServerErrorException('can not get loan status');
    }
  }
}
