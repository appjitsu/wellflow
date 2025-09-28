import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceSchedulesController } from '../maintenance-schedules.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

describe('MaintenanceSchedulesController', () => {
  let controller: MaintenanceSchedulesController;

  beforeEach(async () => {
    const mockCommandBus = {} as jest.Mocked<CommandBus>;
    const mockQueryBus = {} as jest.Mocked<QueryBus>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaintenanceSchedulesController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    }).compile();

    controller = module.get<MaintenanceSchedulesController>(
      MaintenanceSchedulesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
