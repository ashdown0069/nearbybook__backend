import { Expose } from 'class-transformer';
//삭제예정
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
