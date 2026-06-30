import { Test, TestingModule } from '@nestjs/testing';
import { JobTextBuilderService } from './job-text-builder.service';

describe('JobTextBuilderService', () => {
  let service: JobTextBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobTextBuilderService],
    }).compile();

    service = module.get<JobTextBuilderService>(JobTextBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
