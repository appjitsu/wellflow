import { Test, TestingModule } from '@nestjs/testing';

describe('JobErrorHandlerService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<JobErrorHandlerService>(/* JobErrorHandlerService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
