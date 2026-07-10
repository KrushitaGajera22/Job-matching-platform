export class DashboardCandidateDto {
  id!: string;
  firstName!: string;
  lastName!: string;
}
export class DashboardJobDto {
  id!: string;
  title!: string;
}

export class TopMatchDto {
  id!: string;
  jobId!: string;
  candidateId!: string;
  vectorScore!: number;
  skillScore!: number;
  experienceScore!: number;
  finalScore!: number;
  candidate!: DashboardCandidateDto;
  job!: DashboardJobDto;
}

export class RecentJobDto {
  id!: string;
  title!: string;
  isPublished!: boolean;
  createdAt!: Date;
}

export class RecruiterJobDashboardDto {
  totalJobsCount!: number;
  activeJobsCount!: number;
  draftJobsCount!: number;
  recentJobs!: RecentJobDto[];
  topMatches!: TopMatchDto[];
}
