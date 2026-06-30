import { Test, TestingModule } from '@nestjs/testing';
import { MatchExplanationService } from '../../match-explanation.service';

describe('MatchExplanationService', () => {
  let service: MatchExplanationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchExplanationService],
    }).compile();

    service = module.get<MatchExplanationService>(MatchExplanationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
