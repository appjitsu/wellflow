import {
  CreateJibStatementCommand,
  CreateJibOptional,
} from '../create-jib-statement.command';

describe('CreateJibStatementCommand', () => {
  const validOrganizationId = 'org-123';
  const validLeaseId = 'lease-456';
  const validPartnerId = 'partner-789';
  const validStatementPeriodStart = '2024-01-01';
  const validStatementPeriodEnd = '2024-01-31';
  const validDueDate = '2024-02-15';
  const validOptional: CreateJibOptional = {
    grossRevenue: '50000.00',
    netRevenue: '45000.00',
    workingInterestShare: '0.75',
    royaltyShare: '0.25',
    previousBalance: '1000.00',
    currentBalance: '500.00',
    lineItems: [
      {
        type: 'revenue',
        description: 'Oil sales',
        amount: '40000.00',
        quantity: '1000',
        unitCost: '40.00',
      },
      {
        type: 'expense',
        description: 'Drilling costs',
        amount: '5000.00',
      },
    ],
    status: 'draft',
    sentAt: null,
    paidAt: null,
  };

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new CreateJibStatementCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validStatementPeriodStart,
        validStatementPeriodEnd,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.leaseId).toBe(validLeaseId);
      expect(command.partnerId).toBe(validPartnerId);
      expect(command.statementPeriodStart).toBe(validStatementPeriodStart);
      expect(command.statementPeriodEnd).toBe(validStatementPeriodEnd);
      expect(command.dueDate).toBeUndefined();
      expect(command.optional).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new CreateJibStatementCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validStatementPeriodStart,
        validStatementPeriodEnd,
        validDueDate,
        validOptional,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.leaseId).toBe(validLeaseId);
      expect(command.partnerId).toBe(validPartnerId);
      expect(command.statementPeriodStart).toBe(validStatementPeriodStart);
      expect(command.statementPeriodEnd).toBe(validStatementPeriodEnd);
      expect(command.dueDate).toBe(validDueDate);
      expect(command.optional).toEqual(validOptional);
    });

    it('should create a command with dueDate only', () => {
      const command = new CreateJibStatementCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validStatementPeriodStart,
        validStatementPeriodEnd,
        validDueDate,
      );

      expect(command.dueDate).toBe(validDueDate);
      expect(command.optional).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new CreateJibStatementCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validStatementPeriodStart,
        validStatementPeriodEnd,
        validDueDate,
        validOptional,
      );

      expect(command.organizationId).toBeDefined();
      expect(command.leaseId).toBeDefined();
      expect(command.partnerId).toBeDefined();
      expect(command.statementPeriodStart).toBeDefined();
      expect(command.statementPeriodEnd).toBeDefined();
      expect(command.dueDate).toBeDefined();
      expect(command.optional).toBeDefined();
    });

    it('should maintain object reference for optional', () => {
      const command = new CreateJibStatementCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validStatementPeriodStart,
        validStatementPeriodEnd,
        validDueDate,
        validOptional,
      );

      expect(command.optional).toBe(validOptional);
    });
  });

  describe('CreateJibOptional type', () => {
    it('should validate lineItems structure', () => {
      const optional: CreateJibOptional = {
        lineItems: [
          {
            type: 'revenue',
            description: 'Test revenue',
            amount: '1000.00',
          },
          {
            type: 'expense',
            description: 'Test expense',
            quantity: '10',
            unitCost: '50.00',
          },
        ],
      };

      const command = new CreateJibStatementCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validStatementPeriodStart,
        validStatementPeriodEnd,
        undefined,
        optional,
      );

      expect(command.optional).toBeDefined();
      const opt = command.optional as CreateJibOptional;
      expect(opt.lineItems).toBeDefined();
      const lineItems = opt.lineItems!;
      expect(lineItems[0]?.type).toBe('revenue');
      expect(lineItems[0]?.description).toBe('Test revenue');
      expect(lineItems[1]?.type).toBe('expense');
    });

    it('should accept status values', () => {
      const optional: CreateJibOptional = {
        status: 'sent',
      };

      const command = new CreateJibStatementCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validStatementPeriodStart,
        validStatementPeriodEnd,
        undefined,
        optional,
      );

      expect(command.optional?.status).toBe('sent');
    });
  });

  describe('edge cases', () => {
    it('should handle null dueDate', () => {
      const command = new CreateJibStatementCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validStatementPeriodStart,
        validStatementPeriodEnd,
        null,
      );

      expect(command.dueDate).toBeNull();
    });

    it('should handle null lineItems', () => {
      const optional: CreateJibOptional = {
        lineItems: null,
      };

      const command = new CreateJibStatementCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validStatementPeriodStart,
        validStatementPeriodEnd,
        undefined,
        optional,
      );

      expect(command.optional?.lineItems).toBeNull();
    });

    it('should handle empty optional object', () => {
      const command = new CreateJibStatementCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validStatementPeriodStart,
        validStatementPeriodEnd,
        undefined,
        {},
      );

      expect(command.optional).toEqual({});
    });

    it('should handle undefined optional', () => {
      const command = new CreateJibStatementCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validStatementPeriodStart,
        validStatementPeriodEnd,
        undefined,
        undefined,
      );

      expect(command.optional).toBeUndefined();
    });

    it('should handle null sentAt and paidAt', () => {
      const optional: CreateJibOptional = {
        sentAt: null,
        paidAt: null,
      };

      const command = new CreateJibStatementCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validStatementPeriodStart,
        validStatementPeriodEnd,
        undefined,
        optional,
      );

      expect(command.optional?.sentAt).toBeNull();
      expect(command.optional?.paidAt).toBeNull();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new CreateJibStatementCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validStatementPeriodStart,
        validStatementPeriodEnd,
        validDueDate,
        validOptional,
      );

      const orgId1 = command.organizationId;
      const orgId2 = command.organizationId;
      const optional1 = command.optional;
      const optional2 = command.optional;

      expect(orgId1).toBe(orgId2);
      expect(optional1).toBe(optional2);
    });
  });
});
