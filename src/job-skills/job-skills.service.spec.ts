import { Test, TestingModule } from '@nestjs/testing';
import { JobSkillsService } from './job-skills.service';

describe('JobSkillsService', () => {
  let service: JobSkillsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobSkillsService],
    }).compile();

    service = module.get<JobSkillsService>(JobSkillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
