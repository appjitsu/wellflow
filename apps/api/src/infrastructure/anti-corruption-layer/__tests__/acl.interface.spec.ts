import { Test, TestingModule } from '@nestjs/testing';

describe('acl.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<acl.interface>(/* acl.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
