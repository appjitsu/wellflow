import { Test, TestingModule } from '@nestjs/testing';

describe('CurativeItemAssignedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<CurativeItemAssignedEvent>(/* CurativeItemAssignedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
