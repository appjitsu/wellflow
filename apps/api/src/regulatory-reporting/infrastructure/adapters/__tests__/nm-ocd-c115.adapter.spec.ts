import { Test, TestingModule } from '@nestjs/testing';
import { NmOcdC115Adapter } from '../nm-ocd-c115.adapter';

describe('NmOcdC115Adapter', () => {
  let service: NmOcdC115Adapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NmOcdC115Adapter],
    }).compile();

    service = module.get(NmOcdC115Adapter);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
