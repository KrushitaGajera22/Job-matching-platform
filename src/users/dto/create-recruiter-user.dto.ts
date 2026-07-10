import {
  IsEmail,
  isNotEmpty,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateRecruiterUserData {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  lastName!: string;
}
