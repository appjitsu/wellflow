import {
  JibStatement,
  JibStatementProps,
  JibLineItem,
  isJibLineItem,
  deserializeLineItems,
} from '../jib-statement.entity';

describe('JibStatement Entity', () => {
  const validId = 'jib-statement-123';
  const validOrganizationId = 'org-456';
  const validLeaseId = 'lease-789';
  const validPartnerId = 'partner-101';
  const validStatementPeriodStart = '2024-01-01';
  const validStatementPeriodEnd = '2024-01-31';
  const validGrossRevenue = '10000.00';
  const validNetRevenue = '8000.00';
  const validWorkingInterestShare = '0.75';
  const validRoyaltyShare = '0.125';
  const validLineItems: JibLineItem[] = [
    { type: 'revenue', description: 'Oil Sales', amount: '10000.00' },
    { type: 'expense', description: 'Transportation', amount: '2000.00' },
  ];
  const validStatus = 'draft' as const;
  const validSentAt = new Date('2024-02-01');
  const validPaidAt = new Date('2024-02-15');
  const validPreviousBalance = '500.00';
  const validCurrentBalance = '8500.00';
  const validDueDate = '2024-02-28';
  const validCashCallId = 'cash-call-202';
  const validCreatedAt = new Date('2024-01-01');
  const validUpdatedAt = new Date('2024-01-02');

  describe('Constructor', () => {
    it('should create JIB statement with required fields', () => {
      const props: JibStatementProps = {
        organizationId: validOrganizationId,
        leaseId: validLeaseId,
        partnerId: validPartnerId,
        statementPeriodEnd: validStatementPeriodEnd,
        currentBalance: validCurrentBalance,
      };

      const jibStatement = new JibStatement(props);

      expect(jibStatement.getId()).toBe(''); // empty string when id is undefined
      expect(jibStatement.getOrganizationId()).toBe(validOrganizationId);
      expect(jibStatement.getLeaseId()).toBe(validLeaseId);
      expect(jibStatement.getPartnerId()).toBe(validPartnerId);
      expect(jibStatement.getStatementPeriodStart()).toBeUndefined();
      expect(jibStatement.getStatementPeriodEnd()).toBe(
        validStatementPeriodEnd,
      );
      expect(jibStatement.getGrossRevenue()).toBe('0.00'); // default
      expect(jibStatement.getNetRevenue()).toBe('0.00'); // default
      expect(jibStatement.getWorkingInterestShare()).toBe('0.00'); // default
      expect(jibStatement.getRoyaltyShare()).toBe('0.00'); // default
      expect(jibStatement.getLineItems()).toBeNull();
      expect(jibStatement.getStatus()).toBe('draft'); // default
      expect(jibStatement.getSentAt()).toBeNull();
      expect(jibStatement.getPaidAt()).toBeNull();
      expect(jibStatement.getPreviousBalance()).toBe('0.00'); // default
      expect(jibStatement.getDueDate()).toBeNull();
      expect(jibStatement.getCurrentBalance()).toBe(validCurrentBalance);
      expect(jibStatement.getCashCallId()).toBeNull();
    });

    it('should create JIB statement with all optional fields', () => {
      const props: JibStatementProps = {
        id: validId,
        organizationId: validOrganizationId,
        leaseId: validLeaseId,
        partnerId: validPartnerId,
        statementPeriodStart: validStatementPeriodStart,
        statementPeriodEnd: validStatementPeriodEnd,
        grossRevenue: validGrossRevenue,
        netRevenue: validNetRevenue,
        workingInterestShare: validWorkingInterestShare,
        royaltyShare: validRoyaltyShare,
        lineItems: validLineItems,
        status: validStatus,
        sentAt: validSentAt,
        paidAt: validPaidAt,
        previousBalance: validPreviousBalance,
        currentBalance: validCurrentBalance,
        dueDate: validDueDate,
        cashCallId: validCashCallId,
        createdAt: validCreatedAt,
        updatedAt: validUpdatedAt,
      };

      const jibStatement = new JibStatement(props);

      expect(jibStatement.getId()).toBe(validId);
      expect(jibStatement.getOrganizationId()).toBe(validOrganizationId);
      expect(jibStatement.getLeaseId()).toBe(validLeaseId);
      expect(jibStatement.getPartnerId()).toBe(validPartnerId);
      expect(jibStatement.getStatementPeriodStart()).toBe(
        validStatementPeriodStart,
      );
      expect(jibStatement.getStatementPeriodEnd()).toBe(
        validStatementPeriodEnd,
      );
      expect(jibStatement.getGrossRevenue()).toBe(validGrossRevenue);
      expect(jibStatement.getNetRevenue()).toBe(validNetRevenue);
      expect(jibStatement.getWorkingInterestShare()).toBe(
        validWorkingInterestShare,
      );
      expect(jibStatement.getRoyaltyShare()).toBe(validRoyaltyShare);
      expect(jibStatement.getLineItems()).toEqual(validLineItems);
      expect(jibStatement.getStatus()).toBe(validStatus);
      expect(jibStatement.getSentAt()).toBe(validSentAt);
      expect(jibStatement.getPaidAt()).toBe(validPaidAt);
      expect(jibStatement.getPreviousBalance()).toBe(validPreviousBalance);
      expect(jibStatement.getDueDate()).toBe(validDueDate);
      expect(jibStatement.getCurrentBalance()).toBe(validCurrentBalance);
      expect(jibStatement.getCashCallId()).toBe(validCashCallId);
    });

    it('should deep copy line items in constructor', () => {
      const props: JibStatementProps = {
        organizationId: validOrganizationId,
        leaseId: validLeaseId,
        partnerId: validPartnerId,
        statementPeriodEnd: validStatementPeriodEnd,
        currentBalance: validCurrentBalance,
        lineItems: validLineItems,
      };

      const jibStatement = new JibStatement(props);
      const retrievedItems = jibStatement.getLineItems();

      expect(retrievedItems).toEqual(validLineItems);
      expect(retrievedItems).not.toBe(validLineItems); // Different reference
      expect(retrievedItems![0]).not.toBe(validLineItems[0]); // Deep copy
    });
  });

  describe('Getters', () => {
    let jibStatement: JibStatement;

    beforeEach(() => {
      const props: JibStatementProps = {
        id: validId,
        organizationId: validOrganizationId,
        leaseId: validLeaseId,
        partnerId: validPartnerId,
        statementPeriodStart: validStatementPeriodStart,
        statementPeriodEnd: validStatementPeriodEnd,
        grossRevenue: validGrossRevenue,
        netRevenue: validNetRevenue,
        workingInterestShare: validWorkingInterestShare,
        royaltyShare: validRoyaltyShare,
        lineItems: validLineItems,
        status: validStatus,
        sentAt: validSentAt,
        paidAt: validPaidAt,
        previousBalance: validPreviousBalance,
        currentBalance: validCurrentBalance,
        dueDate: validDueDate,
        cashCallId: validCashCallId,
        createdAt: validCreatedAt,
        updatedAt: validUpdatedAt,
      };

      jibStatement = new JibStatement(props);
    });

    it('should return correct id', () => {
      expect(jibStatement.getId()).toBe(validId);
    });

    it('should return correct organization id', () => {
      expect(jibStatement.getOrganizationId()).toBe(validOrganizationId);
    });

    it('should return correct lease id', () => {
      expect(jibStatement.getLeaseId()).toBe(validLeaseId);
    });

    it('should return correct partner id', () => {
      expect(jibStatement.getPartnerId()).toBe(validPartnerId);
    });

    it('should return correct statement period start', () => {
      expect(jibStatement.getStatementPeriodStart()).toBe(
        validStatementPeriodStart,
      );
    });

    it('should return correct statement period end', () => {
      expect(jibStatement.getStatementPeriodEnd()).toBe(
        validStatementPeriodEnd,
      );
    });

    it('should return correct gross revenue', () => {
      expect(jibStatement.getGrossRevenue()).toBe(validGrossRevenue);
    });

    it('should return correct net revenue', () => {
      expect(jibStatement.getNetRevenue()).toBe(validNetRevenue);
    });

    it('should return correct working interest share', () => {
      expect(jibStatement.getWorkingInterestShare()).toBe(
        validWorkingInterestShare,
      );
    });

    it('should return correct royalty share', () => {
      expect(jibStatement.getRoyaltyShare()).toBe(validRoyaltyShare);
    });

    it('should return correct line items', () => {
      expect(jibStatement.getLineItems()).toEqual(validLineItems);
    });

    it('should return correct status', () => {
      expect(jibStatement.getStatus()).toBe(validStatus);
    });

    it('should return correct sent at', () => {
      expect(jibStatement.getSentAt()).toBe(validSentAt);
    });

    it('should return correct paid at', () => {
      expect(jibStatement.getPaidAt()).toBe(validPaidAt);
    });

    it('should return correct previous balance', () => {
      expect(jibStatement.getPreviousBalance()).toBe(validPreviousBalance);
    });

    it('should return correct due date', () => {
      expect(jibStatement.getDueDate()).toBe(validDueDate);
    });

    it('should return correct current balance', () => {
      expect(jibStatement.getCurrentBalance()).toBe(validCurrentBalance);
    });

    it('should return correct cash call id', () => {
      expect(jibStatement.getCashCallId()).toBe(validCashCallId);
    });

    it('should return deep copy of line items', () => {
      const items1 = jibStatement.getLineItems();
      const items2 = jibStatement.getLineItems();

      expect(items1).toEqual(items2);
      expect(items1).not.toBe(items2); // Different references
      if (items1 && items2) {
        expect(items1[0]).not.toBe(items2[0]); // Deep copy
      }
    });
  });

  describe('Business Methods', () => {
    let jibStatement: JibStatement;

    beforeEach(() => {
      const props: JibStatementProps = {
        id: validId,
        organizationId: validOrganizationId,
        leaseId: validLeaseId,
        partnerId: validPartnerId,
        statementPeriodEnd: validStatementPeriodEnd,
        currentBalance: '1000.00',
        createdAt: validCreatedAt,
        updatedAt: validUpdatedAt,
      };

      jibStatement = new JibStatement(props);
    });

    describe('linkCashCall', () => {
      it('should link cash call', () => {
        jibStatement.linkCashCall(validCashCallId);

        expect(jibStatement.getCashCallId()).toBe(validCashCallId);
      });
    });

    describe('applyInterest', () => {
      it('should apply interest to current balance', () => {
        const interestAmount = '50.25';

        jibStatement.applyInterest(interestAmount);

        expect(jibStatement.getCurrentBalance()).toBe('1050.25');
      });

      it('should handle decimal precision correctly', () => {
        jibStatement.applyInterest('0.01');

        expect(jibStatement.getCurrentBalance()).toBe('1000.01');
      });
    });
  });

  describe('Persistence', () => {
    it('should convert to persistence format', () => {
      const props: JibStatementProps = {
        id: validId,
        organizationId: validOrganizationId,
        leaseId: validLeaseId,
        partnerId: validPartnerId,
        statementPeriodStart: validStatementPeriodStart,
        statementPeriodEnd: validStatementPeriodEnd,
        grossRevenue: validGrossRevenue,
        netRevenue: validNetRevenue,
        workingInterestShare: validWorkingInterestShare,
        royaltyShare: validRoyaltyShare,
        lineItems: validLineItems,
        status: validStatus,
        sentAt: validSentAt,
        paidAt: validPaidAt,
        previousBalance: validPreviousBalance,
        currentBalance: validCurrentBalance,
        dueDate: validDueDate,
        cashCallId: validCashCallId,
        createdAt: validCreatedAt,
        updatedAt: validUpdatedAt,
      };

      const jibStatement = new JibStatement(props);
      const persistence = jibStatement.toPersistence();

      expect(persistence).toEqual(props);
    });
  });

  describe('Static Methods', () => {
    describe('computeTotals', () => {
      it('should compute totals from line items', () => {
        const items: JibLineItem[] = [
          { type: 'revenue', description: 'Oil Sales', amount: '10000.00' },
          { type: 'revenue', description: 'Gas Sales', amount: '5000.00' },
          { type: 'expense', description: 'Transportation', amount: '2000.00' },
          { type: 'expense', description: 'Processing', amount: '1000.00' },
        ];

        const totals = JibStatement.computeTotals(items);

        expect(totals.grossRevenue).toBe('15000.00');
        expect(totals.netRevenue).toBe('12000.00');
      });

      it('should compute totals using quantity and unit cost', () => {
        const items: JibLineItem[] = [
          {
            type: 'revenue',
            description: 'Oil Sales',
            quantity: '100',
            unitCost: '50.00',
          },
          {
            type: 'expense',
            description: 'Transportation',
            quantity: '10',
            unitCost: '25.50',
          },
        ];

        const totals = JibStatement.computeTotals(items);

        expect(totals.grossRevenue).toBe('5000.00');
        expect(totals.netRevenue).toBe('4745.00');
      });

      it('should throw error for invalid line items', () => {
        const invalidItems: JibLineItem[] = [
          { type: 'revenue', description: 'Invalid', quantity: '10' }, // missing unitCost
        ];

        expect(() => {
          JibStatement.computeTotals(invalidItems);
        }).toThrow('Line item must include amount or quantity and unitCost');
      });
    });
  });

  describe('Utility Functions', () => {
    describe('isJibLineItem', () => {
      it('should return true for valid line item', () => {
        const validItem: JibLineItem = {
          type: 'revenue',
          description: 'Test Item',
          amount: '100.00',
          quantity: '10',
          unitCost: '10.00',
        };

        expect(isJibLineItem(validItem)).toBe(true);
      });

      it('should return false for invalid type', () => {
        const invalidItem = {
          type: 'invalid',
          description: 'Test Item',
        };

        expect(isJibLineItem(invalidItem)).toBe(false);
      });

      it('should return false for missing description', () => {
        const invalidItem = {
          type: 'revenue',
        };

        expect(isJibLineItem(invalidItem)).toBe(false);
      });

      it('should return false for non-object', () => {
        expect(isJibLineItem('string')).toBe(false);
        expect(isJibLineItem(null)).toBe(false);
        expect(isJibLineItem(undefined)).toBe(false);
      });
    });

    describe('deserializeLineItems', () => {
      it('should deserialize valid line items', () => {
        const input = [
          { type: 'revenue', description: 'Item 1', amount: '100.00' },
          {
            type: 'expense',
            description: 'Item 2',
            quantity: '5',
            unitCost: '20.00',
          },
        ];

        const result = deserializeLineItems(input);

        expect(result).toEqual([
          {
            type: 'revenue',
            description: 'Item 1',
            amount: '100.00',
            quantity: undefined,
            unitCost: undefined,
          },
          {
            type: 'expense',
            description: 'Item 2',
            quantity: '5',
            unitCost: '20.00',
            amount: undefined,
          },
        ]);
      });

      it('should return null for null input', () => {
        expect(deserializeLineItems(null)).toBeNull();
        expect(deserializeLineItems(undefined)).toBeNull();
      });

      it('should return null for non-array input', () => {
        expect(deserializeLineItems('string')).toBeNull();
        expect(deserializeLineItems({})).toBeNull();
      });

      it('should return null for array with invalid items', () => {
        const input = [
          { type: 'revenue', description: 'Valid' },
          { type: 'invalid', description: 'Invalid' },
        ];

        expect(deserializeLineItems(input)).toBeNull();
      });
    });
  });
});
