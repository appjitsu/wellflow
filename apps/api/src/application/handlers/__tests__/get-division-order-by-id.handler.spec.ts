import { Test, TestingModule } from '@nestjs/testing';

describe('GetDivisionOrderByIdHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetDivisionOrderByIdHandler>(/* GetDivisionOrderByIdHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
