export class JobResponseDto {
  id!: string;
  title!: string;
  description!: string;
  location!: string | null;
  minExperience!: number | null;
  maxExperience!: number | null;
  isPublished!: boolean;
  expiresAt!: Date | null;
  recruiterId!: string;
  skills!: string[] | []; // Array of skill names
  createdAt!: Date;
  updatedAt!: Date;
}
