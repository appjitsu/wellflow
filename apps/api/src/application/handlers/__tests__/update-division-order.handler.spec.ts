import { Test, TestingModule } from '@nestjs/testing';

describe('UpdateDivisionOrderHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<UpdateDivisionOrderHandler>(/* UpdateDivisionOrderHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
