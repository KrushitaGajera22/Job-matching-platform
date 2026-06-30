import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateJobDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minExperience?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxExperience?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
