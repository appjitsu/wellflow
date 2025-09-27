import { Test, TestingModule } from '@nestjs/testing';

describe('SetCurativeItemDueDateHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<SetCurativeItemDueDateHandler>(/* SetCurativeItemDueDateHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
