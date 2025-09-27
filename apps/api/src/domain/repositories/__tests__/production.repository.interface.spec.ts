import { Test, TestingModule } from '@nestjs/testing';

describe('production.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<production.repository.interface>(/* production.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
