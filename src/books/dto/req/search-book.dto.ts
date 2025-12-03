import { IsISBN, IsNotEmpty, IsString } from 'class-validator';

export class searchBookDto {
  @IsString()
  @IsNotEmpty()
  @IsISBN('13')
  isbn: string;
}
