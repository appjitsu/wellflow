import { Test, TestingModule } from '@nestjs/testing';

describe('well.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<well.repository.interface>(/* well.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
