import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
export class SearchLibrariesByRegionDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  region: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dtlRegion: number;
}
