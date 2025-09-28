import { Test, TestingModule } from '@nestjs/testing';
import { ProductionModule } from '../production.module';
import { ProductionService } from '../production.service';
import { ProductionController } from '../production.controller';

describe('ProductionModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ProductionModule],
    })
      .overrideProvider('ProductionRepository')
      .useValue({})
      .overrideProvider('AuditLogService')
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(ProductionModule).toBeDefined();
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should have ProductionService as provider', () => {
    const productionService = module.get<ProductionService>(ProductionService);
    expect(productionService).toBeDefined();
  });

  it('should have ProductionController as controller', () => {
    const productionController =
      module.get<ProductionController>(ProductionController);
    expect(productionController).toBeDefined();
  });
});
