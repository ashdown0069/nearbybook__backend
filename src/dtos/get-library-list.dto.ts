import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';
export class GetLibraryListDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  isbn: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  region: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  dtl_region: number;
}
