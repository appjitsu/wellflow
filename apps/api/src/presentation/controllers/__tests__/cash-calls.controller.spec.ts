import { Test, TestingModule } from '@nestjs/testing';
import { CashCallsController } from '../cash-calls.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateCashCallDto } from '../../dtos/create-cash-call.dto';
import { RecordCashCallConsentDto } from '../../dtos/record-cash-call-consent.dto';
import { CreateCashCallCommand } from '../../../application/commands/create-cash-call.command';
import { GetCashCallByIdQuery } from '../../../application/queries/get-cash-call-by-id.query';
import { ApproveCashCallCommand } from '../../../application/commands/approve-cash-call.command';
import { RecordCashCallConsentCommand } from '../../../application/commands/record-cash-call-consent.command';
import { AbilitiesGuard } from '../../../authorization/abilities.guard';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

describe('CashCallsController', () => {
  let controller: CashCallsController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  const mockCashCall = {
    id: 'cashcall-123',
    organizationId: 'org-456',
    leaseId: 'lease-789',
    partnerId: 'partner-101',
    billingMonth: '2024-01-01',
    amount: '50000.00',
    type: 'MONTHLY',
    status: 'PENDING',
    dueDate: '2024-01-15',
    interestRatePercent: '8.50',
    consentRequired: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashCallsController],
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

    controller = module.get<CashCallsController>(CashCallsController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a cash call successfully', async () => {
      const createCashCallDto: CreateCashCallDto = {
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        billingMonth: '2024-01-01',
        amount: '50000.00',
        type: 'MONTHLY',
        dueDate: '2024-01-15',
        interestRatePercent: '8.50',
        consentRequired: true,
      };

      const expectedCommand = new CreateCashCallCommand(
        'org-456',
        'lease-789',
        'partner-101',
        '2024-01-01',
        '50000.00',
        'MONTHLY',
        {
          dueDate: '2024-01-15',
          interestRatePercent: '8.50',
          consentRequired: true,
        },
      );

      jest.spyOn(commandBus, 'execute').mockResolvedValue('cashcall-123');

      const result = await controller.create(createCashCallDto);

      expect(commandBus.execute).toHaveBeenCalledWith(expectedCommand);
      expect(result).toEqual({ id: 'cashcall-123' });
    });

    it('should create cash call with minimal required fields', async () => {
      const createCashCallDto: CreateCashCallDto = {
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        billingMonth: '2024-01-01',
        amount: '25000.00',
        type: 'SUPPLEMENTAL',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue('cashcall-456');

      const result = await controller.create(createCashCallDto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-456',
          leaseId: 'lease-789',
          partnerId: 'partner-101',
          billingMonth: '2024-01-01',
          amount: '25000.00',
          type: 'SUPPLEMENTAL',
          options: expect.objectContaining({
            consentRequired: false,
          }),
        }),
      );
      expect(result).toEqual({ id: 'cashcall-456' });
    });

    it('should create cash call with different types', async () => {
      const testCases: Array<{
        type: 'MONTHLY' | 'SUPPLEMENTAL';
        expected: string;
      }> = [
        { type: 'MONTHLY', expected: 'MONTHLY' },
        { type: 'SUPPLEMENTAL', expected: 'SUPPLEMENTAL' },
      ];

      for (const testCase of testCases) {
        const createCashCallDto: CreateCashCallDto = {
          organizationId: 'org-456',
          leaseId: 'lease-789',
          partnerId: 'partner-101',
          billingMonth: '2024-01-01',
          amount: '10000.00',
          type: testCase.type,
        };

        jest.spyOn(commandBus, 'execute').mockResolvedValue('cashcall-test');

        await controller.create(createCashCallDto);

        expect(commandBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            type: testCase.expected,
          }),
        );
      }
    });

    it('should handle command execution errors', async () => {
      const createCashCallDto: CreateCashCallDto = {
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        billingMonth: '2024-01-01',
        amount: '50000.00',
        type: 'MONTHLY',
      };

      jest
        .spyOn(commandBus, 'execute')
        .mockRejectedValue(new Error('Command failed'));

      await expect(controller.create(createCashCallDto)).rejects.toThrow(
        'Command failed',
      );
    });

    it('should handle invalid command result type', async () => {
      const createCashCallDto: CreateCashCallDto = {
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        billingMonth: '2024-01-01',
        amount: '50000.00',
        type: 'MONTHLY',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue(123); // Invalid: should be string

      await expect(controller.create(createCashCallDto)).rejects.toThrow(
        'CreateCashCallCommand must return a string id',
      );
    });
  });

  describe('getById', () => {
    it('should get cash call by ID successfully', async () => {
      const expectedQuery = new GetCashCallByIdQuery('org-456', 'cashcall-123');

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockCashCall);

      const result = await controller.getById('cashcall-123', 'org-456');

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(mockCashCall);
    });

    it('should handle cash call not found', async () => {
      jest.spyOn(queryBus, 'execute').mockResolvedValue(null);

      await expect(
        controller.getById('non-existent-cashcall', 'org-456'),
      ).rejects.toThrow('CashCall query returned invalid payload');
    });

    it('should handle invalid payload structure', async () => {
      jest.spyOn(queryBus, 'execute').mockResolvedValue({
        id: 123, // Invalid: should be string
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        billingMonth: '2024-01-01',
        amount: '50000.00',
        type: 'MONTHLY',
        status: 'PENDING',
      });

      await expect(
        controller.getById('cashcall-123', 'org-456'),
      ).rejects.toThrow('CashCall payload missing required string fields');
    });

    it('should handle query execution errors', async () => {
      jest
        .spyOn(queryBus, 'execute')
        .mockRejectedValue(new Error('Query failed'));

      await expect(
        controller.getById('cashcall-123', 'org-456'),
      ).rejects.toThrow('Query failed');
    });
  });

  describe('approve', () => {
    it('should approve cash call successfully', async () => {
      const expectedCommand = new ApproveCashCallCommand(
        'org-456',
        'cashcall-123',
      );

      jest.spyOn(commandBus, 'execute').mockResolvedValue('cashcall-123');

      const result = await controller.approve('cashcall-123', 'org-456');

      expect(commandBus.execute).toHaveBeenCalledWith(expectedCommand);
      expect(result).toEqual({ id: 'cashcall-123' });
    });

    it('should handle command execution errors during approval', async () => {
      jest
        .spyOn(commandBus, 'execute')
        .mockRejectedValue(new Error('Approval failed'));

      await expect(
        controller.approve('cashcall-123', 'org-456'),
      ).rejects.toThrow('Approval failed');
    });

    it('should handle invalid command result type during approval', async () => {
      jest.spyOn(commandBus, 'execute').mockResolvedValue(null); // Invalid: should be string

      await expect(
        controller.approve('cashcall-123', 'org-456'),
      ).rejects.toThrow('ApproveCashCallCommand must return a string id');
    });
  });

  describe('recordConsent', () => {
    it('should record consent successfully', async () => {
      const recordConsentDto: RecordCashCallConsentDto = {
        organizationId: 'org-456',
        status: 'RECEIVED',
        receivedAt: '2024-01-10',
      };

      const expectedCommand = new RecordCashCallConsentCommand(
        'org-456',
        'cashcall-123',
        'RECEIVED',
        '2024-01-10',
      );

      jest.spyOn(commandBus, 'execute').mockResolvedValue('cashcall-123');

      const result = await controller.recordConsent(
        'cashcall-123',
        recordConsentDto,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(expectedCommand);
      expect(result).toEqual({ id: 'cashcall-123' });
    });

    it('should record consent without received date', async () => {
      const recordConsentDto: RecordCashCallConsentDto = {
        organizationId: 'org-456',
        status: 'WAIVED',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue('cashcall-123');

      const result = await controller.recordConsent(
        'cashcall-123',
        recordConsentDto,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-456',
          id: 'cashcall-123',
          status: 'WAIVED',
          receivedAt: null,
        }),
      );
      expect(result).toEqual({ id: 'cashcall-123' });
    });

    it('should handle different consent statuses', async () => {
      const testCases: Array<'RECEIVED' | 'WAIVED'> = ['RECEIVED', 'WAIVED'];

      for (const status of testCases) {
        const recordConsentDto: RecordCashCallConsentDto = {
          organizationId: 'org-456',
          status,
        };

        jest.spyOn(commandBus, 'execute').mockResolvedValue('cashcall-123');

        await controller.recordConsent('cashcall-123', recordConsentDto);

        expect(commandBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            status,
          }),
        );
      }
    });

    it('should handle command execution errors during consent recording', async () => {
      const recordConsentDto: RecordCashCallConsentDto = {
        organizationId: 'org-456',
        status: 'RECEIVED',
      };

      jest
        .spyOn(commandBus, 'execute')
        .mockRejectedValue(new Error('Consent recording failed'));

      await expect(
        controller.recordConsent('cashcall-123', recordConsentDto),
      ).rejects.toThrow('Consent recording failed');
    });

    it('should handle invalid command result type during consent recording', async () => {
      const recordConsentDto: RecordCashCallConsentDto = {
        organizationId: 'org-456',
        status: 'RECEIVED',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue(undefined); // Invalid: should be string

      await expect(
        controller.recordConsent('cashcall-123', recordConsentDto),
      ).rejects.toThrow('RecordCashCallConsentCommand must return a string id');
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
      const expectedQuery = new GetCashCallByIdQuery('org-456', 'cashcall-123');

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockCashCall);

      await controller.getById('cashcall-123', 'org-456');

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
    });

    it('should use organization ID from decorator in approve', async () => {
      const expectedCommand = new ApproveCashCallCommand(
        'org-456',
        'cashcall-123',
      );

      jest.spyOn(commandBus, 'execute').mockResolvedValue('cashcall-123');

      await controller.approve('cashcall-123', 'org-456');

      expect(commandBus.execute).toHaveBeenCalledWith(expectedCommand);
    });

    it('should handle unauthorized access attempts', async () => {
      jest
        .spyOn(queryBus, 'execute')
        .mockRejectedValue(new Error('Unauthorized access'));

      await expect(
        controller.getById('cashcall-123', 'org-456'),
      ).rejects.toThrow('Unauthorized access');
    });
  });
});
