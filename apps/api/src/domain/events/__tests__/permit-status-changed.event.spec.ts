import { Test, TestingModule } from '@nestjs/testing';

describe('PermitStatusChangedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<PermitStatusChangedEvent>(/* PermitStatusChangedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
