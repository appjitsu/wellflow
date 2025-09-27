import { Test, TestingModule } from '@nestjs/testing';

describe('PermitResponseDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<PermitResponseDto>(/* PermitResponseDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
