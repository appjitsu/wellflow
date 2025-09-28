import { Test, TestingModule } from '@nestjs/testing';
import { VersionInterceptor } from '../version.interceptor';
import { VersionService } from '../version.service';

describe('VersionInterceptor', () => {
  let interceptor: VersionInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VersionInterceptor, VersionService],
    }).compile();

    interceptor = module.get(VersionInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });
});
