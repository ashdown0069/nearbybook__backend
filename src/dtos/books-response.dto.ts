import { Expose, Type } from 'class-transformer';

/**
 * @class BookDto
 * @description 클라이언트에게 노출될 개별 책의 데이터 형식을 정의합니다.
 * @property {string} bookname - 책 제목
 * @property {string} authors - 저자
 * @property {string} publisher - 출판사
 * @property {string} publicationYear - 출판 연도
 * @property {string} isbn - ISBN 번호
 * @property {string} vol - 권 정보
 * @property {string} bookImageURL - 책 표지 이미지 URL
 */
export class BookDto {
  @Expose() // 이 프로퍼티를 직렬화 과정에서 노출시킵니다.
  bookname: string;

  @Expose()
  authors: string;

  @Expose()
  publisher: string;

  @Expose({ name: 'publication_year' })
  publicationYear: string;

  @Expose({ name: 'isbn13' })
  isbn: string;

  @Expose()
  vol: string;

  @Expose()
  bookImageURL: string;
}

export class BookListResponseDto {
  @Expose()
  pages: number;

  @Type(() => BookDto)
  @Expose({ name: 'books' })
  books: BookDto[];

  @Expose()
  numFound: number;
}
