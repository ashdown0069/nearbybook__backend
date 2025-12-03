import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

//삭제예정
export class searchBookDto {
  @IsEnum(['title', 'isbn'], {
    message: 'mode must be either title or isbn',
  })
  @IsNotEmpty()
  mode: 'title' | 'isbn';

  @IsString()
  @IsNotEmpty()
  query: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageNo: number;
}
