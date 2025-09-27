import { Test, TestingModule } from '@nestjs/testing';

describe('SagaOrchestratorService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<SagaOrchestratorService>(/* SagaOrchestratorService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
