import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database.module';
import { DatabaseService } from './database.service';

describe('DatabaseModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [DatabaseModule, ConfigModule.forRoot()],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide DatabaseService', () => {
    const databaseService = module.get<DatabaseService>(DatabaseService);
    expect(databaseService).toBeDefined();
    expect(databaseService).toBeInstanceOf(DatabaseService);
  });

  it('should export DatabaseService', () => {
    const databaseService = module.get<DatabaseService>(DatabaseService);
    expect(databaseService).toBeDefined();
  });

  it('should have ConfigModule as dependency', () => {
    // Test that the module compiles successfully with ConfigModule
    expect(module).toBeDefined();
  });
});
