import { HttpService } from '@nestjs/axios';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { AppService } from 'src/app.service';
import { CommonService } from 'src/common/common.service';
import { Cacheable } from 'src/decorator/cache.decorator';

@Injectable()
export class LibrariesService {
  private readonly logger = new Logger(AppService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Cacheable({
    ttl: 1000 * 60 * 60, // 1 hours
    customKey: (args) => `${args[0]}_${args[1]}_${args[2]}`,
  })
  async fetchLibrariesByISBN(
    ISBN: string,
    region: number,
    detailRegion: number,
  ) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`/libSrchByBook`, {
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
      this.commonService.sendMessageToDiscord(
        'getLibraryListByISBN service error',
        JSON.stringify(error),
        'Error',
      );
      throw new InternalServerErrorException('can not get library list');
    }
  }

  @Cacheable({
    ttl: 1000 * 60 * 60 * 24, // 1 days
    customKey: (args) => `${args[0]}_${args[1] ? args[1] : ''}`,
  })
  async fetchRegionLibraryList(region: number, dtlRegion?: number) {
    let params = {};
    if (dtlRegion) {
      params = {
        region: region,
        dtl_region: dtlRegion,
      };
    } else {
      params = {
        region: region,
      };
    }
    try {
      const result = await lastValueFrom(
        this.httpService.get(`/libSrch`, {
          params: {
            authKey: process.env.LIBRARY_BIGDATA_API_KEY,
            pageNo: 1,
            pageSize: 500,
            format: 'json',
            ...params,
          },
        }),
      );

      // return result.data;
      return result.data.response.libs.map((lib) => lib.lib);
    } catch (error) {
      this.logger.error('getRegionLibraryList service error', error);
      this.commonService.sendMessageToDiscord(
        'getRegionLibraryList service error',
        JSON.stringify(error),
        'Error',
      );
      throw new InternalServerErrorException('can not get library list');
    }
  }

  async findLibrariesByISBN__Web(
    ISBN: string,
    region: number,
    dtlRegion: number,
  ) {
    const libsWithBookPromise = this.fetchLibrariesByISBN(
      ISBN,
      region,
      dtlRegion,
    );

    const regionLibsPromise = this.fetchRegionLibraryList(region, dtlRegion);

    const [libsWithBook, regionLibs] = await Promise.all([
      libsWithBookPromise,
      regionLibsPromise,
    ]);

    const result = regionLibs.map((lib: any) => ({
      hasBook: libsWithBook.some(
        (libWithBook: any) => libWithBook.libCode === lib.libCode,
      ),
      ...lib,
    }));

    return result;
  }
}
