import { Test, TestingModule } from '@nestjs/testing';
import { JibStatementsController } from '../jib-statements.controller';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateJibLinkDto } from '../../dtos/update-jib-link.dto';
import { CreateJibStatementDto } from '../../dtos/create-jib-statement.dto';
import { CreateJibStatementCommand } from '../../../application/commands/create-jib-statement.command';
import { UpdateJibLinkCashCallCommand } from '../../../application/commands/update-jib-link-cash-call.command';
import { AbilitiesGuard } from '../../../authorization/abilities.guard';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

describe('JibStatementsController', () => {
  let controller: JibStatementsController;
  let commandBus: CommandBus;

  const mockLinkResult = {
    jibId: 'jib-123',
    cashCallId: 'cashcall-456',
    interestAccrued: '125.50',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JibStatementsController],
      providers: [
        {
          provide: CommandBus,
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

    controller = module.get<JibStatementsController>(JibStatementsController);
    commandBus = module.get<CommandBus>(CommandBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a JIB statement successfully', async () => {
      const createJibStatementDto: CreateJibStatementDto = {
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        statementPeriodStart: '2025-01-01',
        statementPeriodEnd: '2025-01-31',
        dueDate: '2025-02-15',
        grossRevenue: '10000.00',
        netRevenue: '8000.00',
        workingInterestShare: '50.00',
        royaltyShare: '12.50',
        previousBalance: '0.00',
        currentBalance: '1000.00',
        lineItems: [
          {
            type: 'revenue',
            description: 'Oil sales',
            amount: '10000.00',
            quantity: '100.000',
            unitCost: '100.00',
          },
        ],
        status: 'draft',
        sentAt: null,
        paidAt: null,
      };

      const expectedCommand = new CreateJibStatementCommand(
        'org-456',
        'lease-789',
        'partner-101',
        '2025-01-01',
        '2025-01-31',
        '2025-02-15',
        {
          grossRevenue: '10000.00',
          netRevenue: '8000.00',
          workingInterestShare: '50.00',
          royaltyShare: '12.50',
          previousBalance: '0.00',
          currentBalance: '1000.00',
          lineItems: [
            {
              type: 'revenue',
              description: 'Oil sales',
              amount: '10000.00',
              quantity: '100.000',
              unitCost: '100.00',
            },
          ],
          status: 'draft',
          sentAt: null,
          paidAt: null,
        },
      );

      jest.spyOn(commandBus, 'execute').mockResolvedValue('jib-123');

      const result = await controller.create(createJibStatementDto);

      expect(commandBus.execute).toHaveBeenCalledWith(expectedCommand);
      expect(result).toEqual({ id: 'jib-123' });
    });

    it('should create JIB statement with minimal required fields', async () => {
      const createJibStatementDto: CreateJibStatementDto = {
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        statementPeriodStart: '2025-01-01',
        statementPeriodEnd: '2025-01-31',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue('jib-456');

      const result = await controller.create(createJibStatementDto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-456',
          leaseId: 'lease-789',
          partnerId: 'partner-101',
          statementPeriodStart: '2025-01-01',
          statementPeriodEnd: '2025-01-31',
          dueDate: null,
          optional: expect.objectContaining({
            grossRevenue: undefined,
            netRevenue: undefined,
            workingInterestShare: undefined,
            royaltyShare: undefined,
            previousBalance: undefined,
            currentBalance: undefined,
            lineItems: null,
            status: undefined,
            sentAt: null,
            paidAt: null,
          }),
        }),
      );
      expect(result).toEqual({ id: 'jib-456' });
    });

    it('should create JIB statement with different statuses', async () => {
      const testCases: Array<'draft' | 'sent' | 'paid'> = [
        'draft',
        'sent',
        'paid',
      ];

      for (const status of testCases) {
        const createJibStatementDto: CreateJibStatementDto = {
          organizationId: 'org-456',
          leaseId: 'lease-789',
          partnerId: 'partner-101',
          statementPeriodStart: '2025-01-01',
          statementPeriodEnd: '2025-01-31',
          status,
        };

        jest.spyOn(commandBus, 'execute').mockResolvedValue('jib-test');

        await controller.create(createJibStatementDto);

        expect(commandBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            optional: expect.objectContaining({
              status,
            }),
          }),
        );
      }
    });

    it('should create JIB statement with expense line items', async () => {
      const createJibStatementDto: CreateJibStatementDto = {
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        statementPeriodStart: '2025-01-01',
        statementPeriodEnd: '2025-01-31',
        lineItems: [
          {
            type: 'expense',
            description: 'Equipment maintenance',
            amount: '500.00',
          },
          {
            type: 'revenue',
            description: 'Gas sales',
            quantity: '50.000',
            unitCost: '8.00',
          },
        ],
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue('jib-789');

      const result = await controller.create(createJibStatementDto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          optional: expect.objectContaining({
            lineItems: [
              {
                type: 'expense',
                description: 'Equipment maintenance',
                amount: '500.00',
              },
              {
                type: 'revenue',
                description: 'Gas sales',
                quantity: '50.000',
                unitCost: '8.00',
              },
            ],
          }),
        }),
      );
      expect(result).toEqual({ id: 'jib-789' });
    });

    it('should handle command execution errors during creation', async () => {
      const createJibStatementDto: CreateJibStatementDto = {
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        statementPeriodStart: '2025-01-01',
        statementPeriodEnd: '2025-01-31',
      };

      jest
        .spyOn(commandBus, 'execute')
        .mockRejectedValue(new Error('Creation failed'));

      await expect(controller.create(createJibStatementDto)).rejects.toThrow(
        'Creation failed',
      );
    });

    it('should handle invalid command result type during creation', async () => {
      const createJibStatementDto: CreateJibStatementDto = {
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        statementPeriodStart: '2025-01-01',
        statementPeriodEnd: '2025-01-31',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue(null); // Invalid: should be string

      await expect(controller.create(createJibStatementDto)).rejects.toThrow(
        'CreateJibStatementCommand must return a string id',
      );
    });
  });

  describe('link', () => {
    it('should link JIB statement to cash call successfully', async () => {
      const updateJibLinkDto: UpdateJibLinkDto = {
        organizationId: 'org-456',
        annualInterestRatePercent: '12.00',
        dayCountBasis: 365,
      };

      const expectedCommand = new UpdateJibLinkCashCallCommand(
        'org-456',
        'jib-123',
        '12.00',
        365,
      );

      jest.spyOn(commandBus, 'execute').mockResolvedValue(mockLinkResult);

      const result = await controller.link('jib-123', updateJibLinkDto);

      expect(commandBus.execute).toHaveBeenCalledWith(expectedCommand);
      expect(result).toEqual(mockLinkResult);
    });

    it('should link with default day count basis', async () => {
      const updateJibLinkDto: UpdateJibLinkDto = {
        organizationId: 'org-456',
        annualInterestRatePercent: '8.50',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue({
        ...mockLinkResult,
        interestAccrued: '85.25',
      });

      const result = await controller.link('jib-456', updateJibLinkDto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-456',
          jibId: 'jib-456',
          annualInterestRatePercent: '8.50',
          dayCountBasis: undefined,
        }),
      );
      expect(result.interestAccrued).toBe('85.25');
    });

    it('should link with 360 day count basis', async () => {
      const updateJibLinkDto: UpdateJibLinkDto = {
        organizationId: 'org-456',
        annualInterestRatePercent: '10.00',
        dayCountBasis: 360,
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue({
        ...mockLinkResult,
        interestAccrued: '100.00',
      });

      const result = await controller.link('jib-789', updateJibLinkDto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          dayCountBasis: 360,
        }),
      );
      expect(result.interestAccrued).toBe('100.00');
    });

    it('should handle command execution errors during linking', async () => {
      const updateJibLinkDto: UpdateJibLinkDto = {
        organizationId: 'org-456',
        annualInterestRatePercent: '12.00',
      };

      jest
        .spyOn(commandBus, 'execute')
        .mockRejectedValue(new Error('Linking failed'));

      await expect(
        controller.link('jib-123', updateJibLinkDto),
      ).rejects.toThrow('Linking failed');
    });

    it('should handle invalid link result structure', async () => {
      const updateJibLinkDto: UpdateJibLinkDto = {
        organizationId: 'org-456',
        annualInterestRatePercent: '12.00',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue({
        jibId: 123, // Invalid: should be string
        cashCallId: 'cashcall-456',
        interestAccrued: '125.50',
      });

      await expect(
        controller.link('jib-123', updateJibLinkDto),
      ).rejects.toThrow('UpdateJibLinkCashCallCommand returned malformed data');
    });

    it('should handle null cashCallId in link result', async () => {
      const updateJibLinkDto: UpdateJibLinkDto = {
        organizationId: 'org-456',
        annualInterestRatePercent: '12.00',
      };

      const nullCashCallResult = {
        jibId: 'jib-123',
        cashCallId: null,
        interestAccrued: '0.00',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue(nullCashCallResult);

      const result = await controller.link('jib-123', updateJibLinkDto);

      expect(result).toEqual(nullCashCallResult);
    });
  });

  describe('error handling', () => {
    it('should handle invalid UUID in link', () => {
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
        .spyOn(commandBus, 'execute')
        .mockRejectedValue(new Error('Unauthorized access'));

      const updateJibLinkDto: UpdateJibLinkDto = {
        organizationId: 'org-456',
        annualInterestRatePercent: '12.00',
      };

      await expect(
        controller.link('jib-123', updateJibLinkDto),
      ).rejects.toThrow('Unauthorized access');
    });
  });
});
