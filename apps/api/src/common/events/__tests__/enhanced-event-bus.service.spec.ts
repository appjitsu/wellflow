import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus, CqrsModule } from '@nestjs/cqrs';
import { ModuleRef } from '@nestjs/core';
import { EnhancedEventBusService } from '../enhanced-event-bus.service';

describe('EnhancedEventBusService', () => {
  let service: EnhancedEventBusService;

  const mockCommandBus = {
    execute: jest.fn(),
    register: jest.fn(),
    registerHandler: jest.fn(),
    publish: jest.fn(),
  };

  const mockQueryBus = {
    execute: jest.fn(),
    register: jest.fn(),
    registerHandler: jest.fn(),
  };

  const mockModuleRef = {
    get: jest.fn(),
    resolve: jest.fn(),
    create: jest.fn(),
  };

  const mockUnhandledExceptionBus = {
    registerHandler: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule.forRoot()],
      providers: [EnhancedEventBusService],
    })
      .overrideProvider(CommandBus)
      .useValue(mockCommandBus)
      .overrideProvider(QueryBus)
      .useValue(mockQueryBus)
      .overrideProvider(ModuleRef)
      .useValue(mockModuleRef)
      .overrideProvider('UnhandledExceptionBus')
      .useValue(mockUnhandledExceptionBus)
      .overrideProvider('CQRS_MODULE_OPTIONS')
      .useValue({})
      .compile();

    service = module.get<EnhancedEventBusService>(EnhancedEventBusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
