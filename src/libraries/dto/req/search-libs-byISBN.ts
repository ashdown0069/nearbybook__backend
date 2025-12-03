import { Type } from 'class-transformer';
import { IsInt, IsISBN, IsNotEmpty, IsOptional } from 'class-validator';
export class SearchLibrariesByISBNDto {
  @IsNotEmpty()
  @IsISBN()
  isbn: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  region: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dtlRegion: number;
}
