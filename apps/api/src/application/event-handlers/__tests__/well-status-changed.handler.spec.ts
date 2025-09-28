import { Test, TestingModule } from '@nestjs/testing';
import { WellStatusChangedHandler } from '../well-status-changed.handler';

describe('WellStatusChangedHandler', () => {
  let service: WellStatusChangedHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WellStatusChangedHandler],
    }).compile();

    service = module.get<WellStatusChangedHandler>(WellStatusChangedHandler);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
