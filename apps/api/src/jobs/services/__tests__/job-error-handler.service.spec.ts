import { Test, TestingModule } from '@nestjs/testing';
import { JobErrorHandlerService } from '../job-error-handler.service';

describe('JobErrorHandlerService', () => {
  let service: JobErrorHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobErrorHandlerService],
    }).compile();

    service = module.get(JobErrorHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
