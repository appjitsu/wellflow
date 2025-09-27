import { Test, TestingModule } from '@nestjs/testing';

describe('afe.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<afe.repository.interface>(/* afe.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
