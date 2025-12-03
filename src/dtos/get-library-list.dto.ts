import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';
export class GetLibraryListDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  region: number;
}
//삭제예정
