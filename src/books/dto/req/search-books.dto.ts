import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  IsISBN,
  ValidateIf,
} from 'class-validator';

export class searchBooksDto {
  @IsEnum(['title', 'isbn'], {
    message: 'mode must be either title or isbn',
  })
  @IsNotEmpty()
  mode: 'title' | 'isbn';

  @Transform(({ value }) => {
    return value.trim().replace(/ /g, '');
  })
  @IsString()
  @IsNotEmpty()
  @ValidateIf((object) => object.mode === 'isbn')
  @IsISBN('13')
  query: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageNo: number;
}
