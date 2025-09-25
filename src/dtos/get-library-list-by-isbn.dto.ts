import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
export class GetLibraryListByIsbnDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  isbn: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  region: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dtl_region: number;
}
