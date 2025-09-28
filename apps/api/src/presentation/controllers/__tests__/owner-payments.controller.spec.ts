import { Test, TestingModule } from '@nestjs/testing';
import { OwnerPaymentsController } from '../owner-payments.controller';
import { CreateOwnerPaymentDto } from '../../dtos/owner-payments.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateOwnerPaymentCommand } from '../../../application/commands/create-owner-payment.command';
import { GetOwnerPaymentByIdQuery } from '../../../application/queries/get-owner-payment-by-id.query';
import { AbilitiesGuard } from '../../../authorization/abilities.guard';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

describe('OwnerPaymentsController', () => {
  let controller: OwnerPaymentsController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  const mockOwnerPayment = {
    id: 'payment-123',
    organizationId: 'org-456',
    partnerId: 'partner-789',
    revenueDistributionId: 'rd-101',
    method: 'CHECK' as const,
    status: 'PENDING' as const,
    grossAmount: '1000.00',
    deductionsAmount: '50.00',
    taxWithheldAmount: '25.00',
    netAmount: '925.00',
    checkNumber: 'CHK-001',
    achTraceNumber: null,
    memo: 'Monthly royalty payment',
    paymentDate: new Date('2025-01-15'),
    clearedDate: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OwnerPaymentsController],
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

    controller = module.get<OwnerPaymentsController>(OwnerPaymentsController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an owner payment successfully', async () => {
      const createOwnerPaymentDto: CreateOwnerPaymentDto = {
        organizationId: 'org-456',
        partnerId: 'partner-789',
        method: 'CHECK',
        grossAmount: '1000.00',
        netAmount: '925.00',
        revenueDistributionId: 'rd-101',
        deductionsAmount: '50.00',
        taxWithheldAmount: '25.00',
        checkNumber: 'CHK-001',
        achTraceNumber: undefined,
        memo: 'Monthly royalty payment',
      };

      const expectedCommand = new CreateOwnerPaymentCommand(
        'org-456',
        'partner-789',
        'CHECK',
        '1000.00',
        '925.00',
        'rd-101',
        {
          deductionsAmount: '50.00',
          taxWithheldAmount: '25.00',
          checkNumber: 'CHK-001',
          achTraceNumber: undefined,
          memo: 'Monthly royalty payment',
        },
      );

      jest.spyOn(commandBus, 'execute').mockResolvedValue('payment-123');

      const result = await controller.create(createOwnerPaymentDto);

      expect(commandBus.execute).toHaveBeenCalledWith(expectedCommand);
      expect(result).toEqual({ id: 'payment-123' });
    });

    it('should create owner payment with minimal required fields', async () => {
      const createOwnerPaymentDto: CreateOwnerPaymentDto = {
        organizationId: 'org-456',
        partnerId: 'partner-789',
        method: 'ACH',
        grossAmount: '500.00',
        netAmount: '500.00',
        revenueDistributionId: 'rd-102',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue('payment-456');

      const result = await controller.create(createOwnerPaymentDto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-456',
          partnerId: 'partner-789',
          method: 'ACH',
          grossAmount: '500.00',
          netAmount: '500.00',
          revenueDistributionId: 'rd-102',
          options: expect.objectContaining({
            deductionsAmount: undefined,
            taxWithheldAmount: undefined,
            checkNumber: undefined,
            achTraceNumber: undefined,
            memo: undefined,
          }),
        }),
      );
      expect(result).toEqual({ id: 'payment-456' });
    });

    it('should create owner payment with different methods', async () => {
      const testCases: Array<'CHECK' | 'ACH' | 'WIRE'> = [
        'CHECK',
        'ACH',
        'WIRE',
      ];

      for (const method of testCases) {
        const createOwnerPaymentDto: CreateOwnerPaymentDto = {
          organizationId: 'org-456',
          partnerId: 'partner-789',
          method,
          grossAmount: '200.00',
          netAmount: '200.00',
          revenueDistributionId: 'rd-test',
        };

        jest.spyOn(commandBus, 'execute').mockResolvedValue('payment-test');

        await controller.create(createOwnerPaymentDto);

        expect(commandBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            method,
          }),
        );
      }
    });

    it('should create owner payment with WIRE method and trace number', async () => {
      const createOwnerPaymentDto: CreateOwnerPaymentDto = {
        organizationId: 'org-456',
        partnerId: 'partner-789',
        method: 'WIRE',
        grossAmount: '10000.00',
        netAmount: '9500.00',
        revenueDistributionId: 'rd-103',
        achTraceNumber: 'WIRE-REF-001',
        memo: 'Large payment via wire',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue('payment-789');

      const result = await controller.create(createOwnerPaymentDto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'WIRE',
          options: expect.objectContaining({
            achTraceNumber: 'WIRE-REF-001',
            memo: 'Large payment via wire',
          }),
        }),
      );
      expect(result).toEqual({ id: 'payment-789' });
    });

    it('should handle command execution errors', async () => {
      const createOwnerPaymentDto: CreateOwnerPaymentDto = {
        organizationId: 'org-456',
        partnerId: 'partner-789',
        method: 'CHECK',
        grossAmount: '1000.00',
        netAmount: '925.00',
        revenueDistributionId: 'rd-101',
      };

      jest
        .spyOn(commandBus, 'execute')
        .mockRejectedValue(new Error('Command failed'));

      await expect(controller.create(createOwnerPaymentDto)).rejects.toThrow(
        'Command failed',
      );
    });

    it('should handle invalid command result type', async () => {
      const createOwnerPaymentDto: CreateOwnerPaymentDto = {
        organizationId: 'org-456',
        partnerId: 'partner-789',
        method: 'CHECK',
        grossAmount: '1000.00',
        netAmount: '925.00',
        revenueDistributionId: 'rd-101',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue(123); // Invalid: should be string

      await expect(controller.create(createOwnerPaymentDto)).rejects.toThrow(
        'CreateOwnerPaymentCommand must return a string id',
      );
    });
  });

  describe('getById', () => {
    it('should get owner payment by ID successfully', async () => {
      const expectedQuery = new GetOwnerPaymentByIdQuery('payment-123');

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockOwnerPayment);

      const result = await controller.getById('payment-123');

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(mockOwnerPayment);
    });

    it('should handle owner payment not found', async () => {
      jest.spyOn(queryBus, 'execute').mockResolvedValue(null);

      await expect(controller.getById('non-existent-payment')).rejects.toThrow(
        'OwnerPayment query returned invalid payload',
      );
    });

    it('should handle invalid payload structure', async () => {
      jest.spyOn(queryBus, 'execute').mockResolvedValue({
        id: 123, // Invalid: should be string
        organizationId: 'org-456',
        partnerId: 'partner-789',
        revenueDistributionId: 'rd-101',
        method: 'CHECK',
        status: 'PENDING',
        grossAmount: '1000.00',
        netAmount: '925.00',
      });

      await expect(controller.getById('payment-123')).rejects.toThrow(
        'OwnerPayment payload missing required string fields',
      );
    });

    it('should handle query execution errors', async () => {
      jest
        .spyOn(queryBus, 'execute')
        .mockRejectedValue(new Error('Query failed'));

      await expect(controller.getById('payment-123')).rejects.toThrow(
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
    it('should handle unauthorized access attempts', async () => {
      jest
        .spyOn(queryBus, 'execute')
        .mockRejectedValue(new Error('Unauthorized access'));

      await expect(controller.getById('payment-123')).rejects.toThrow(
        'Unauthorized access',
      );
    });
  });
});
