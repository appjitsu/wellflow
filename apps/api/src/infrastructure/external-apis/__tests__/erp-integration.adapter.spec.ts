import { Test, TestingModule } from '@nestjs/testing';

describe('ERPIntegrationAdapter', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<ERPIntegrationAdapter>(/* ERPIntegrationAdapter */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
