import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

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
