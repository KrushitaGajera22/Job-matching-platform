import { IsNumber, IsString } from 'class-validator';

export class CandidateMatchDto {
  @IsString()
  candidateId!: string;

  @IsString()
  firstName!: string;
  @IsString()
  lastName!: string;

  @IsNumber()
  vectorScore!: number;
  @IsNumber()
  skillScore!: number;
  @IsNumber()
  experienceScore!: number;

  @IsNumber()
  finalScore!: number;
}
