import { Test, TestingModule } from '@nestjs/testing';
import { OSHARegulatoryACL } from '../osha-regulatory-acl';

describe('OSHARegulatoryACL', () => {
  let service: OSHARegulatoryACL;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OSHARegulatoryACL],
    }).compile();

    service = module.get<OSHARegulatoryACL>(OSHARegulatoryACL);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
