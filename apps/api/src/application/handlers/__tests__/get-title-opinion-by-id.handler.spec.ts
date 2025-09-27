import { Test, TestingModule } from '@nestjs/testing';

describe('TitleOpinionView', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<TitleOpinionView>(/* TitleOpinionView */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
