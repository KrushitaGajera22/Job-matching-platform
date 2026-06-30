import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ActiveDeactiveSkillDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsBoolean()
  @IsNotEmpty()
  isActive!: boolean;
}
