import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpsertJobSkillsDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  skillIds!: string[];
}
