import { Test, TestingModule } from '@nestjs/testing';

describe('UpdateTitleOpinionFindingsHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<UpdateTitleOpinionFindingsHandler>(/* UpdateTitleOpinionFindingsHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
