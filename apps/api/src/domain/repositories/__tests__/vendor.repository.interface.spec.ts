import { Test, TestingModule } from '@nestjs/testing';

describe('vendor.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<vendor.repository.interface>(/* vendor.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
