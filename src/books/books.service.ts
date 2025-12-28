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
import { XMLParser } from 'fast-xml-parser';
import { Cacheable } from 'src/decorator/cache.decorator';

@Injectable()
export class BooksService {
  private readonly parser = new XMLParser();
  private readonly logger = new Logger(AppService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * 책 검색으로는 검색결과가 없지만 도서 소장 도서관 검색에는
   * 도서가 검색되는 경우가 있어 Naver api로 한번 더 검색
   */
  @Cacheable({
    ttl: 1000 * 60 * 60, // 1 hours
    customKey: (args) => `isbn-${args[0]}`,
  })
  async searchBook__naver(isbn: searchBookDto['isbn']) {
    try {
      const resultXML = await this.httpService.axiosRef.get(
        'https://openapi.naver.com/v1/search/book_adv.xml',
        {
          headers: {
            'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': process.env.NAVER_SECRET,
          },
          params: {
            d_isbn: isbn,
          },
        },
      );
      const jsonObj = this.parser.parse(resultXML.data);

      if (!jsonObj?.rss?.channel?.item) {
        return {};
      }

      const item = jsonObj.rss.channel.item;
      const book = {
        bookname: item.title,
        authors: item.author,
        publisher: item.publisher,
        publication_year: item.pubdate.toString().slice(0, 4),
        isbn: item.isbn,
        bookImageURL: item.image,
      };
      return book;
    } catch (error) {
      this.logger.error('searchBook__naver service error', error);
      this.commonService.sendMessageToDiscord(
        'searchBook__naver error',
        JSON.stringify(error),
        'Error',
      );
      throw new InternalServerErrorException('searchBook__naver error');
    }
  }

  async searchBook(isbn: searchBookDto['isbn']) {
    try {
      const result = await lastValueFrom(
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

      if (result.data.response.error) {
        return await this.searchBook__naver(isbn);
      }
      const foundBook = result.data.response.detail[0].book;
      if (foundBook) {
        return foundBook;
      }
      return {};
    } catch (error) {
      this.logger.error('searchBook service error', error);
      return {};
    }
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
