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
import { BookDto, BookListResponseDto } from './dtos/books-response.dto';
import { FeedbackDto } from './dtos/feedback.dto';
import { LoanAvailableDto } from './dtos/loan-available';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { GetLibraryListDto } from './dtos/get-library-list.dto';
import { CommonService } from './common/common.service';
@Controller('/')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly commonService: CommonService,
  ) {}

  @Get()
  async getHello() {
    return this.appService.getHello();
  }

  //삭제예정
  @UseInterceptors(CacheInterceptor)
  @Get('/loan')
  async getBookLoanStatus(@Query() query: LoanAvailableDto) {
    //response { hasBook: 'Y', loanAvailable: 'N' }

    return await this.appService.getBookLoanStatus(query.isbn, query.libCode);
  }

  //삭제예정
  //도서관
  // @UseInterceptors(CacheInterceptor)
  @Get('/getlibs')
  async SearchLibsForMap(@Query() query: GetLibraryListByIsbnDto) {
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
    console.log(
      'getlibs',
      result.map((lib) => lib.hasBook),
    );
    return result;
  }

  //삭제예정
  //도서관
  @Get('/getRegionLibs')
  async getRegionLibList(@Query() query: GetLibraryListDto) {
    console.log('getRegionLibs', query);
    return await this.appService.getRegionLibraryList(query.region);
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

  //삭제예정
  //책
  @UseInterceptors(CacheInterceptor)
  @Serialize(BookListResponseDto)
  @Get('/searchbooks')
  async SearchBooks(@Query() query: searchBookDto) {
    const result = await this.appService.getBooks(
      query.mode,
      query.query,
      query.pageNo,
    );
    return result;
  }

  @Post('/feedback')
  async feedback(@Body() Body: FeedbackDto) {
    return await this.commonService.sendMessageToDiscord(
      Body.title,
      Body.description,
      'Feedback',
      Body.email,
    );
  }
  //삭제예정
  //책
  @Serialize(BookDto)
  @Get('/popularloanbooks')
  async getPopularLoanBooks() {
    return await this.appService.getPopularLoanBooks();
  }

  //삭제예정
  //  @UseInterceptors(CacheInterceptor)
  @Get('/search')
  // async search(@Query() query: searchBookDto) {
  async search(@Query() query: any) {
    const title = this.appService.getBooksByTitle(query.query);
    const author = this.appService.getBooksByAuthor(query.query);

    const result = await Promise.all([title, author]);
    return result;
  }
}
