import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { GetLibraryListByIsbnDto } from './dtos/get-library-list-by-isbn.dto';
import { Serialize } from './interceptors/serialize.interceptor';
import { LibraryResponseDto } from './dtos/libs-response.dto';
import { searchBookDto } from './dtos/search-book.dto';
import { BookListResponseDto } from './dtos/books-response.dto';
import { FeedbackDto } from './dtos/feedback.dto';
import { LoanAvailableDto } from './dtos/loan-available';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { GetLibraryListDto } from './dtos/get-library-list.dto';
@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello() {
    return this.appService.getHello();
  }

  @UseInterceptors(CacheInterceptor)
  @Get('/loan')
  async getBookLoanStatus(@Query() query: LoanAvailableDto) {
    return this.appService.getBookLoanStatus(query.isbn, query.libCode);
  }

  @UseInterceptors(CacheInterceptor)
  @Get('/getlibs')
  async SearchLibsForMap(@Query() query: GetLibraryListDto) {
    const regionLibList = await this.appService.getLibraryList(
      query.region,
      query.dtl_region,
    );

    const libListWithBook = await this.appService.getLibraryListByISBN(
      query.isbn,
      query.region,
      query.dtl_region,
    );
    const result = regionLibList.map((lib: any) => ({
      hasBook: libListWithBook.some(
        (libWithBook: any) => libWithBook.libCode === lib.libCode,
      ),
      ...lib,
    }));

    return result;
  }

  @UseInterceptors(CacheInterceptor)
  @Serialize(LibraryResponseDto)
  @Get('/isbn')
  async SearchLibsByISBN(@Query() query: GetLibraryListByIsbnDto) {
    const result = await this.appService.getLibraryListByISBN(
      query.isbn,
      query.region,
      query.dtl_region,
    );

    return result;
  }

  @UseInterceptors(CacheInterceptor)
  @Serialize(BookListResponseDto)
  @Get('/searchbooks')
  async SearchBooks(@Query() query: searchBookDto) {
    const result = await this.appService.getBooks(
      query.mode,
      query.query,
      query.pageNo,
    );

    console.log('/searchbooks', query, result);
    return result;
  }

  @Post('/feedback')
  async feedback(@Body() Body: FeedbackDto) {
    return await this.appService.sendMessageToDiscord(
      Body.title,
      Body.description,
      'Feedback',
      Body.email,
    );
  }
}
