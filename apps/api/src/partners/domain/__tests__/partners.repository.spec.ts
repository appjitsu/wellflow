import { Test, TestingModule } from '@nestjs/testing';

describe('partners.repository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<partners.repository>(/* partners.repository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
