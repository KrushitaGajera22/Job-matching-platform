import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateUserProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  lastName!: string;
}
