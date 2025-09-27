import { Test, TestingModule } from '@nestjs/testing';

describe('JobSchedulerController', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<JobSchedulerController>(/* JobSchedulerController */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
