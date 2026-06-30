import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UpdatePublishedFlagDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsBoolean()
  @IsNotEmpty()
  isPublished!: boolean;
}
