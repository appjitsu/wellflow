import { Test, TestingModule } from '@nestjs/testing';
import { VersioningModule } from '../versioning.module';
import { VersionService } from '../version.service';

describe('VersioningModule', () => {
  let module: TestingModule;
  let versionService: VersionService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [VersioningModule],
    }).compile();

    versionService = module.get<VersionService>(VersionService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide VersionService', () => {
    expect(versionService).toBeDefined();
  });
});
