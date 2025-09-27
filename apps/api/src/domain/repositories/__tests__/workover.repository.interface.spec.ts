import { Test, TestingModule } from '@nestjs/testing';

describe('workover.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<workover.repository.interface>(/* workover.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
