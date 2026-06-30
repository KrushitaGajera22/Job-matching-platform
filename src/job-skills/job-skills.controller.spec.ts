import { Test, TestingModule } from '@nestjs/testing';
import { JobSkillsController } from './job-skills.controller';

describe('JobSkillsController', () => {
  let controller: JobSkillsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobSkillsController],
    }).compile();

    controller = module.get<JobSkillsController>(JobSkillsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
