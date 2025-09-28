import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { UpdateVendorPerformanceHandler } from '../update-vendor-performance.handler';

describe('UpdateVendorPerformanceHandler', () => {
  let handler: UpdateVendorPerformanceHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateVendorPerformanceHandler,
        {
          provide: 'VendorRepository',
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: EventBus,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<UpdateVendorPerformanceHandler>(
      UpdateVendorPerformanceHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
