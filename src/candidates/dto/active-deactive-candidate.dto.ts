import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ActiveDeactiveCandidateDto {
  @IsBoolean()
  @IsNotEmpty()
  isActive!: boolean;
}
