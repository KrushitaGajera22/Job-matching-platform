import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSkillDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}
