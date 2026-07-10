import { JobResponseDto } from '../../jobs/dto/job-response.dto';

export class AdminDashboardSummaryDto {
  totalRecruiters!: number;
  totalCandidates!: number;
  totalJobs!: number;
  publishedJobs!: number;
  draftJobs!: number;
  totalMatches!: number;
}

export class AdminDashboardUserDto {
  id!: string;
  firstName!: string | null;
  lastName!: string | null;
  email!: string;
  createdAt!: Date;
}

export class AdminDashboardDto {
  summary!: AdminDashboardSummaryDto;
  recentRecruiters!: AdminDashboardUserDto[];
  recentCandidates!: AdminDashboardUserDto[];
  recentJobs!: JobResponseDto[];
}
