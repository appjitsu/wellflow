import { Test, TestingModule } from '@nestjs/testing';

describe('SetTenantContextUseCase', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<SetTenantContextUseCase>(/* SetTenantContextUseCase */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
