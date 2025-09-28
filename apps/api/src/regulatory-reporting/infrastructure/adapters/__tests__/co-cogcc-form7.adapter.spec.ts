import { Test, TestingModule } from '@nestjs/testing';
import { CoCogccForm7Adapter } from '../co-cogcc-form7.adapter';

describe('CoCogccForm7Adapter', () => {
  let service: CoCogccForm7Adapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoCogccForm7Adapter],
    }).compile();

    service = module.get(CoCogccForm7Adapter);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
