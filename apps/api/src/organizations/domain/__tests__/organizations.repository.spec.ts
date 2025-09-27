import { Test, TestingModule } from '@nestjs/testing';

describe('organizations.repository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<organizations.repository>(/* organizations.repository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
