import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
//삭제예정
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
