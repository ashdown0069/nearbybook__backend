import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';
export class LoanAvailableDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  isbn: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  libCode: number;
}
