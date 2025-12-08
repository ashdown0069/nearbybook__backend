import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { BooksService } from './books.service';

import { LoanAvailableDto } from './dto/req/loan-available';
import { searchBooksDto } from './dto/req/search-books.dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { TrendingBooksDto } from './dto/res/trending.dto';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { BookDto, BooksResponseDto } from './dto/res/books.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @UseInterceptors(CacheInterceptor)
  @Serialize(BooksResponseDto)
  @Get('/search')
  async searchBooks(@Query() query: searchBooksDto) {
    return await this.booksService.searchBooks(
      query.mode,
      query.query,
      query.pageNo,
    );
  }

  @UseInterceptors(CacheInterceptor)
  @Serialize(BookDto)
  @Get('/search/:isbn')
  async searchBook(@Param('isbn') isbn: string) {
    return await this.booksService.searchBook(isbn);
  }

  //검색창 밑 검색어 추천
  @UseInterceptors(CacheInterceptor)
  @Serialize(TrendingBooksDto)
  @Get('/trending')
  async getTrendingBooks() {
    return await this.booksService.getTrendingBooks();
  }

  //지도에서 사용
  @Get('/loanstatus')
  async getBookLoanStatus(@Query() query: LoanAvailableDto) {
    return await this.booksService.getBookLoanStatus(query.isbn, query.libCode);
  }

  //main page에서 사용
  @UseInterceptors(CacheInterceptor)
  @Serialize(BookDto)
  @Get('/popularloanbooks')
  async getPopularLoanBooks() {
    return await this.booksService.getPopularLoanBooks();
  }
}
