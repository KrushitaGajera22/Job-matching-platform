export class CandidateDashboardSummaryDto {
  recommendedJobsCount!: number;
  resumeUploaded!: boolean;
  profileScore!: number;
}
export class CandidateDashboardMatchDto {
  id!: string;
  jobId!: string;
  candidateId!: string;
  vectorScore!: number;
  skillScore!: number;
  experienceScore!: number;
  finalScore!: number;
  job!: {
    id: string;
    title: string;
    location: string | null;
  };
}

export class CandidateDashboardDto {
  summary!: CandidateDashboardSummaryDto;
  recommendedMatches!: CandidateDashboardMatchDto[];
  skills!: string[];
}
