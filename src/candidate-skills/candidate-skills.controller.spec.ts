import { Test, TestingModule } from '@nestjs/testing';
import { CandidateSkillsController } from './candidate-skills.controller';

describe('CandidateSkillsController', () => {
  let controller: CandidateSkillsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidateSkillsController],
    }).compile();

    controller = module.get<CandidateSkillsController>(CandidateSkillsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
