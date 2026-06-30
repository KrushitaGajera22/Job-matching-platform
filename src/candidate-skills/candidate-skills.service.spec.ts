import { Test, TestingModule } from '@nestjs/testing';
import { CandidateSkillsService } from './candidate-skills.service';

describe('CandidateSkillsService', () => {
  let service: CandidateSkillsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CandidateSkillsService],
    }).compile();

    service = module.get<CandidateSkillsService>(CandidateSkillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
