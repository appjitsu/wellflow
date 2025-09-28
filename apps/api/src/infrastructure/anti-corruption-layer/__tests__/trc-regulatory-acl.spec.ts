import { Test, TestingModule } from '@nestjs/testing';
import { TRCRegulatoryACL } from '../trc-regulatory-acl';

describe('TRCRegulatoryACL', () => {
  let service: TRCRegulatoryACL;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TRCRegulatoryACL],
    }).compile();

    service = module.get<TRCRegulatoryACL>(TRCRegulatoryACL);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
