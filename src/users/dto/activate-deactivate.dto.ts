import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ActivateDeactivateDto {
  @IsBoolean()
  @IsNotEmpty()
  isActive!: boolean;

  @IsString()
  @IsNotEmpty()
  id!: string;
}
