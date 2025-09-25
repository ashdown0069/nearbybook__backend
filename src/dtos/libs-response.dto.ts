import { Expose } from 'class-transformer';

// @Exclude()를 사용하여 DTO에 정의되지 않은 속성은 모두 제외합니다.
export class LibraryResponseDto {
  @Expose()
  libCode: string;

  @Expose()
  libName: string;

  @Expose()
  address: string;

  @Expose()
  tel: string;

  @Expose()
  fax: string;

  @Expose()
  latitude: string;

  @Expose()
  longitude: string;

  @Expose()
  homepage: string;

  @Expose()
  closed: string;

  @Expose()
  operatingTime: string;
}
