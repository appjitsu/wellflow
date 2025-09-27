import { Test, TestingModule } from '@nestjs/testing';

describe('CreateTitleOpinionHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<CreateTitleOpinionHandler>(/* CreateTitleOpinionHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
