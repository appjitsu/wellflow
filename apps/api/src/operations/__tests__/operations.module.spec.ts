import { Test, TestingModule } from '@nestjs/testing';

describe('OperationsModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<OperationsModule>(/* OperationsModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
