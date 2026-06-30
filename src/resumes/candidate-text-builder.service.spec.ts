import { Test, TestingModule } from '@nestjs/testing';
import { CandidateTextBuilderService } from './candidate-text-builder.service';

describe('CandidateTextBuilderService', () => {
  let service: CandidateTextBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CandidateTextBuilderService],
    }).compile();

    service = module.get<CandidateTextBuilderService>(CandidateTextBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
