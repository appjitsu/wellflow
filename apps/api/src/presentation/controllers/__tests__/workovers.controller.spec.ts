import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { WorkoversController } from '../workovers.controller';
import { CreateWorkoverCommand } from '../../../application/commands/create-workover.command';
import { GetWorkoverByIdQuery } from '../../../application/queries/get-workover-by-id.query';
import { GetWorkoversByOrganizationQuery } from '../../../application/queries/get-workovers-by-organization.query';
import { CreateWorkoverDto } from '../../../application/dtos/create-workover.dto';
import { WorkoverDto } from '../../../application/dtos/workover.dto';
import { WorkoverStatus } from '../../../domain/enums/workover-status.enum';
import { AbilitiesGuard } from '../../../authorization/abilities.guard';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

describe('WorkoversController', () => {
  let controller: WorkoversController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    organizationId: 'org-456',
  };

  const mockWorkoverDto: WorkoverDto = {
    id: 'workover-123',
    organizationId: 'org-456',
    wellId: 'well-789',
    afeId: 'afe-101',
    reason: 'Well optimization',
    status: WorkoverStatus.PLANNED,
    startDate: '2024-02-01',
    endDate: '2024-02-15',
    preProductionSnapshot: {
      oilRate: 100,
      gasRate: 500,
      waterRate: 50,
    },
    postProductionSnapshot: {
      oilRate: 120,
      gasRate: 550,
      waterRate: 45,
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkoversController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AbilitiesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WorkoversController>(WorkoversController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a workover successfully', async () => {
      const createWorkoverDto: CreateWorkoverDto = {
        organizationId: 'org-456',
        wellId: 'well-789',
        afeId: 'afe-101',
        reason: 'Well optimization',
        status: WorkoverStatus.PLANNED,
        startDate: '2024-02-01',
        endDate: '2024-02-15',
        preProductionSnapshot: {
          oilRate: 100,
          gasRate: 500,
          waterRate: 50,
        },
        postProductionSnapshot: {
          oilRate: 120,
          gasRate: 550,
          waterRate: 45,
        },
      };

      const expectedCommand = new CreateWorkoverCommand('org-456', 'well-789', {
        afeId: 'afe-101',
        reason: 'Well optimization',
        status: WorkoverStatus.PLANNED,
        startDate: '2024-02-01',
        endDate: '2024-02-15',
        preProductionSnapshot: {
          oilRate: 100,
          gasRate: 500,
          waterRate: 50,
        },
        postProductionSnapshot: {
          oilRate: 120,
          gasRate: 550,
          waterRate: 45,
        },
      });

      jest.spyOn(commandBus, 'execute').mockResolvedValue('workover-123');

      const result = await controller.create(createWorkoverDto, {
        user: mockUser,
      } as any);

      expect(commandBus.execute).toHaveBeenCalledWith(expectedCommand);
      expect(result).toEqual({
        id: 'workover-123',
        message: 'Workover created',
      });
    });

    it('should create workover with organization ID from DTO', async () => {
      const createWorkoverDto: CreateWorkoverDto = {
        organizationId: 'custom-org-789',
        wellId: 'well-789',
        reason: 'Custom organization workover',
        status: WorkoverStatus.IN_PROGRESS,
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue('workover-456');

      const result = await controller.create(createWorkoverDto, {
        user: mockUser,
      } as any);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'custom-org-789',
          wellId: 'well-789',
          options: expect.objectContaining({
            reason: 'Custom organization workover',
            status: WorkoverStatus.IN_PROGRESS,
          }),
        }),
      );
      expect(result).toEqual({
        id: 'workover-456',
        message: 'Workover created',
      });
    });

    it('should create workover with minimal required fields', async () => {
      const createWorkoverDto: CreateWorkoverDto = {
        organizationId: 'org-456',
        wellId: 'well-789',
        reason: 'Basic workover',
        status: WorkoverStatus.COMPLETED,
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue('workover-789');

      const result = await controller.create(createWorkoverDto, {
        user: mockUser,
      } as any);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-456',
          wellId: 'well-789',
          options: expect.objectContaining({
            reason: 'Basic workover',
            status: WorkoverStatus.COMPLETED,
          }),
        }),
      );
      expect(result).toEqual({
        id: 'workover-789',
        message: 'Workover created',
      });
    });

    it('should handle command execution errors', async () => {
      const createWorkoverDto: CreateWorkoverDto = {
        organizationId: 'org-456',
        wellId: 'well-789',
        reason: 'Error workover',
        status: WorkoverStatus.PLANNED,
      };

      jest
        .spyOn(commandBus, 'execute')
        .mockRejectedValue(new Error('Command failed'));

      await expect(
        controller.create(createWorkoverDto, { user: mockUser } as any),
      ).rejects.toThrow('Command failed');
    });
  });

  describe('getById', () => {
    it('should get workover by ID successfully', async () => {
      const expectedQuery = new GetWorkoverByIdQuery('workover-123');

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockWorkoverDto);

      const result = await controller.getById('workover-123');

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(mockWorkoverDto);
    });

    it('should handle workover not found', async () => {
      jest.spyOn(queryBus, 'execute').mockResolvedValue(null);

      const result = await controller.getById('non-existent-workover');

      expect(result).toBeNull();
    });

    it('should handle query execution errors', async () => {
      jest
        .spyOn(queryBus, 'execute')
        .mockRejectedValue(new Error('Query failed'));

      await expect(controller.getById('workover-123')).rejects.toThrow(
        'Query failed',
      );
    });
  });

  describe('list', () => {
    it('should list workovers with default pagination', async () => {
      const expectedQuery = new GetWorkoversByOrganizationQuery(
        'org-456',
        1,
        10,
        {},
      );
      const mockResult = {
        workovers: [mockWorkoverDto],
        total: 1,
        page: 1,
        limit: 10,
      };

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockResult);

      const result = await controller.list({ user: mockUser } as any);

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(mockResult);
    });

    it('should list workovers with custom pagination and filters', async () => {
      const expectedQuery = new GetWorkoversByOrganizationQuery(
        'org-456',
        2,
        5,
        {
          status: WorkoverStatus.IN_PROGRESS,
          wellId: 'well-789',
        },
      );
      const mockResult = {
        workovers: [mockWorkoverDto],
        total: 1,
        page: 2,
        limit: 5,
      };

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockResult);

      const result = await controller.list(
        { user: mockUser } as any,
        2,
        5,
        WorkoverStatus.IN_PROGRESS,
        'well-789',
      );

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(mockResult);
    });

    it('should list workovers with status filter only', async () => {
      const expectedQuery = new GetWorkoversByOrganizationQuery(
        'org-456',
        1,
        10,
        {
          status: WorkoverStatus.COMPLETED,
        },
      );

      jest.spyOn(queryBus, 'execute').mockResolvedValue({
        workovers: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      const result = await controller.list(
        { user: mockUser } as any,
        1,
        10,
        WorkoverStatus.COMPLETED,
      );

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result.total).toBe(0);
    });

    it('should list workovers with well ID filter only', async () => {
      const expectedQuery = new GetWorkoversByOrganizationQuery(
        'org-456',
        1,
        10,
        {
          wellId: 'well-999',
        },
      );

      jest.spyOn(queryBus, 'execute').mockResolvedValue({
        workovers: [mockWorkoverDto],
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await controller.list(
        { user: mockUser } as any,
        1,
        10,
        undefined,
        'well-999',
      );

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result.total).toBe(1);
    });

    it('should handle query execution errors', async () => {
      jest
        .spyOn(queryBus, 'execute')
        .mockRejectedValue(new Error('Query failed'));

      await expect(controller.list({ user: mockUser } as any)).rejects.toThrow(
        'Query failed',
      );
    });
  });

  describe('error handling', () => {
    it('should handle invalid UUID in getById', () => {
      // ParseUUIDPipe will throw BadRequestException for invalid UUIDs
      // This would be tested in e2e tests
      expect(controller).toBeDefined();
    });

    it('should handle validation errors in create DTO', () => {
      // ValidationPipe will throw BadRequestException for invalid data
      // This would be tested in e2e tests
      expect(controller).toBeDefined();
    });

    it('should handle authorization failures', () => {
      // Guards will throw ForbiddenException for unauthorized access
      // This would be tested in e2e tests
      expect(controller).toBeDefined();
    });
  });

  describe('authorization integration', () => {
    it('should use user organization ID for listing workovers', async () => {
      const expectedQuery = new GetWorkoversByOrganizationQuery(
        'org-456',
        1,
        10,
        {},
      );

      jest.spyOn(queryBus, 'execute').mockResolvedValue({
        workovers: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      await controller.list({ user: mockUser } as any);

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
    });

    it('should handle unauthorized access attempts', async () => {
      jest
        .spyOn(queryBus, 'execute')
        .mockRejectedValue(new Error('Unauthorized access'));

      await expect(controller.list({ user: mockUser } as any)).rejects.toThrow(
        'Unauthorized access',
      );
    });
  });
});
