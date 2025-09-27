import { Test, TestingModule } from '@nestjs/testing';

describe('base-regulatory-acl', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<base-regulatory-acl>(/* base-regulatory-acl */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

