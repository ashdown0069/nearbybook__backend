import { Controller, Get, Query } from '@nestjs/common';
import { LibrariesService } from './libraries.service';
import { SearchLibrariesByISBNDto } from './dto/req/search-libs-byISBN';
import { SearchLibrariesByRegionDto } from './dto/req/search-libs-byRegion';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { LibraryResponseDto } from './dto/res/libs-response.dto';

@Controller('libraries')
export class LibrariesController {
  constructor(private readonly librariesService: LibrariesService) {}

  //도서(isbn사용) 소장 도서관 검색
  @Serialize(LibraryResponseDto)
  @Get('/searchbyisbn')
  async findLibrariesByBookISBN(@Query() query: SearchLibrariesByISBNDto) {
    return await this.librariesService.findLibrariesByBookISBN(
      query.isbn,
      query.region,
      query.dtlRegion,
    );
  }

  //공공 도서관 찾기용
  @Serialize(LibraryResponseDto)
  @Get('/searchbyregion')
  async findLibrariesByRegion(
    @Query()
    query: SearchLibrariesByRegionDto,
  ) {
    return await this.librariesService.fetchRegionLibraryList(
      query.region,
      query.dtlRegion,
    );
  }
}
