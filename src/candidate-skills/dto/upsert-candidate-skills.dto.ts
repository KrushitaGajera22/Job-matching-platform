import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class UpsertCandidateSkillsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  skillIds!: string[];
}
