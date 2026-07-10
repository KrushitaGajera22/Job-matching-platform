import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetCandidateDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn([
    'firstName',
    'lastName',
    'phone',
    'createdAt',
    'location',
    'currentTitle',
    'yearsExperience',
  ])
  sortBy?:
    | 'firstName'
    | 'lastName'
    | 'phone'
    | 'createdAt'
    | 'location'
    | 'currentTitle'
    | 'yearsExperience';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
