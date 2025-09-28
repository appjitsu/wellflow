import { Test, TestingModule } from '@nestjs/testing';
import { EPARegulatoryACL } from '../epa-regulatory-acl';

describe('EPARegulatoryACL', () => {
  let service: EPARegulatoryACL;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EPARegulatoryACL],
    }).compile();

    service = module.get<EPARegulatoryACL>(EPARegulatoryACL);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
