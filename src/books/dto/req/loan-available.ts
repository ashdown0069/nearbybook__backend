import { Type } from 'class-transformer';
import { IsInt, IsISBN, IsNotEmpty } from 'class-validator';
export class LoanAvailableDto {
  @IsNotEmpty()
  @IsISBN('13')
  isbn: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  libCode: number;
}
