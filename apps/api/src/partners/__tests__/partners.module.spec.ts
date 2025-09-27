import { Test, TestingModule } from '@nestjs/testing';

describe('PartnersModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<PartnersModule>(/* PartnersModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
