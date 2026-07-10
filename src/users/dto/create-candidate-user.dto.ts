import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCandidateUserData {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;
}
