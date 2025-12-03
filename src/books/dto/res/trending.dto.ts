import { Expose } from 'class-transformer';

export class TrendingBooksDto {
  @Expose()
  bookname: string;

  @Expose({ name: 'isbn13' })
  isbn: string;
}
