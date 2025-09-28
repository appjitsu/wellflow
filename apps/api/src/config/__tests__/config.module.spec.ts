import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '../config.module';
import { AppConfigService } from '../app.config';

describe('ConfigModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AppConfigService', () => {
    const appConfigService = module.get<AppConfigService>(AppConfigService);
    expect(appConfigService).toBeDefined();
    expect(appConfigService).toBeInstanceOf(AppConfigService);
  });
});
