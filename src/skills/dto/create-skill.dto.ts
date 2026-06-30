import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class CreateSkillsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  skills!: string[];
}
