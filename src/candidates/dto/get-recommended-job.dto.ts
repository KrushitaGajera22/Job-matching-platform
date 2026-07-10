import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetRecommendedJobDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn([
    'finalScore',
    'vectorScore',
    'skillScore',
    'experienceScore',
    'createdAt',
  ])
  sortBy?:
    | 'finalScore'
    | 'vectorScore'
    | 'skillScore'
    | 'experienceScore'
    | 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
