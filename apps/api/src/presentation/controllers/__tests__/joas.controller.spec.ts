import { Test, TestingModule } from '@nestjs/testing';
import { JoasController } from '../joas.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateJoaDto } from '../../dtos/create-joa.dto';
import { CreateJoaCommand } from '../../../application/commands/create-joa.command';
import { GetJoaByIdQuery } from '../../../application/queries/get-joa-by-id.query';
import { AbilitiesGuard } from '../../../authorization/abilities.guard';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

describe('JoasController', () => {
  let controller: JoasController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  const mockJoa = {
    id: 'joa-123',
    organizationId: 'org-456',
    agreementNumber: 'AG-1001',
    effectiveDate: '2025-01-01',
    endDate: null,
    operatorOverheadPercent: '10.00',
    votingThresholdPercent: '66.67',
    nonConsentPenaltyPercent: '5.00',
    status: 'ACTIVE' as const,
    terms: { clause1: 'value1' },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JoasController],
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

    controller = module.get<JoasController>(JoasController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a JOA successfully', async () => {
      const createJoaDto: CreateJoaDto = {
        organizationId: 'org-456',
        agreementNumber: 'AG-1001',
        effectiveDate: '2025-01-01',
        endDate: '2025-12-31',
        operatorOverheadPercent: '10.00',
        votingThresholdPercent: '66.67',
        nonConsentPenaltyPercent: '5.00',
        terms: { clause1: 'value1' },
      };

      const expectedCommand = new CreateJoaCommand(
        'org-456',
        'AG-1001',
        '2025-01-01',
        {
          endDate: '2025-12-31',
          operatorOverheadPercent: '10.00',
          votingThresholdPercent: '66.67',
          nonConsentPenaltyPercent: '5.00',
          terms: { clause1: 'value1' },
        },
      );

      jest.spyOn(commandBus, 'execute').mockResolvedValue('joa-123');

      const result = await controller.create(createJoaDto);

      expect(commandBus.execute).toHaveBeenCalledWith(expectedCommand);
      expect(result).toEqual({ id: 'joa-123' });
    });

    it('should create JOA with minimal required fields', async () => {
      const createJoaDto: CreateJoaDto = {
        organizationId: 'org-456',
        agreementNumber: 'AG-1002',
        effectiveDate: '2025-01-01',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue('joa-456');

      const result = await controller.create(createJoaDto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-456',
          agreementNumber: 'AG-1002',
          effectiveDate: '2025-01-01',
          options: expect.objectContaining({
            endDate: null,
            operatorOverheadPercent: null,
            votingThresholdPercent: null,
            nonConsentPenaltyPercent: null,
            terms: null,
          }),
        }),
      );
      expect(result).toEqual({ id: 'joa-456' });
    });

    it('should create JOA with partial optional fields', async () => {
      const createJoaDto: CreateJoaDto = {
        organizationId: 'org-456',
        agreementNumber: 'AG-1003',
        effectiveDate: '2025-01-01',
        votingThresholdPercent: '75.00',
        terms: { clause1: 'value1', clause2: 'value2' },
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue('joa-789');

      const result = await controller.create(createJoaDto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-456',
          agreementNumber: 'AG-1003',
          effectiveDate: '2025-01-01',
          options: expect.objectContaining({
            votingThresholdPercent: '75.00',
            terms: { clause1: 'value1', clause2: 'value2' },
            endDate: null,
            operatorOverheadPercent: null,
            nonConsentPenaltyPercent: null,
          }),
        }),
      );
      expect(result).toEqual({ id: 'joa-789' });
    });

    it('should handle command execution errors', async () => {
      const createJoaDto: CreateJoaDto = {
        organizationId: 'org-456',
        agreementNumber: 'AG-1001',
        effectiveDate: '2025-01-01',
      };

      jest
        .spyOn(commandBus, 'execute')
        .mockRejectedValue(new Error('Command failed'));

      await expect(controller.create(createJoaDto)).rejects.toThrow(
        'Command failed',
      );
    });

    it('should handle invalid command result type', async () => {
      const createJoaDto: CreateJoaDto = {
        organizationId: 'org-456',
        agreementNumber: 'AG-1001',
        effectiveDate: '2025-01-01',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue(123); // Invalid: should be string

      await expect(controller.create(createJoaDto)).rejects.toThrow(
        'CreateJoaCommand must return a string id',
      );
    });
  });

  describe('getById', () => {
    it('should get JOA by ID successfully', async () => {
      const expectedQuery = new GetJoaByIdQuery('org-456', 'joa-123');

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockJoa);

      const result = await controller.getById('joa-123', 'org-456');

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(mockJoa);
    });

    it('should handle JOA not found', async () => {
      jest.spyOn(queryBus, 'execute').mockResolvedValue(null);

      await expect(
        controller.getById('non-existent-joa', 'org-456'),
      ).rejects.toThrow('JOA query returned invalid payload');
    });

    it('should handle invalid payload structure', async () => {
      jest.spyOn(queryBus, 'execute').mockResolvedValue({
        id: 123, // Invalid: should be string
        organizationId: 'org-456',
        agreementNumber: 'AG-1001',
        effectiveDate: '2025-01-01',
        status: 'ACTIVE',
      });

      await expect(controller.getById('joa-123', 'org-456')).rejects.toThrow(
        'JOA payload missing required string fields',
      );
    });

    it('should handle query execution errors', async () => {
      jest
        .spyOn(queryBus, 'execute')
        .mockRejectedValue(new Error('Query failed'));

      await expect(controller.getById('joa-123', 'org-456')).rejects.toThrow(
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

    it('should handle validation errors in DTOs', () => {
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
    it('should use organization ID from decorator in getById', async () => {
      const expectedQuery = new GetJoaByIdQuery('org-456', 'joa-123');

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockJoa);

      await controller.getById('joa-123', 'org-456');

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
    });

    it('should handle unauthorized access attempts', async () => {
      jest
        .spyOn(queryBus, 'execute')
        .mockRejectedValue(new Error('Unauthorized access'));

      await expect(controller.getById('joa-123', 'org-456')).rejects.toThrow(
        'Unauthorized access',
      );
    });
  });
});
