import { CandidateMatchDto } from './candidate-match.dto';

export class MatchResponseDto {
  jobId!: string;

  matches!: CandidateMatchDto[];
}
