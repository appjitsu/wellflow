import { Test, TestingModule } from '@nestjs/testing';

describe('afe-approval.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<afe-approval.repository.interface>(/* afe-approval.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

