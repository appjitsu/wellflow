import { Test, TestingModule } from '@nestjs/testing';

describe('PermitStatus', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<PermitStatus>(/* PermitStatus */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
