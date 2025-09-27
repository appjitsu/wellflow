import { Test, TestingModule } from '@nestjs/testing';

describe('IncidentsService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<IncidentsService>(/* IncidentsService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
