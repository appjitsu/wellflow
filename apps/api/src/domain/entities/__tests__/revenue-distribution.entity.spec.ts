import {
  RevenueDistribution,
  ProductionVolumes,
  RevenueBreakdown,
  PaymentInfo,
} from '../revenue-distribution.entity';
import { Money } from '../../value-objects/money';
import { ProductionMonth } from '../../value-objects/production-month';

describe('RevenueDistribution Entity', () => {
  const currency = 'USD';
  const validProductionMonth = ProductionMonth.fromDate(new Date('2024-01-01'));
  const validProductionVolumes: ProductionVolumes = {
    oilVolume: 1000,
    gasVolume: 5000,
  };
  const validRevenueBreakdown: RevenueBreakdown = {
    oilRevenue: new Money(50000, currency),
    gasRevenue: new Money(25000, currency),
    totalRevenue: new Money(75000, currency),
    severanceTax: new Money(7500, currency),
    adValorem: new Money(2250, currency),
    transportationCosts: new Money(1500, currency),
    processingCosts: new Money(1000, currency),
    otherDeductions: new Money(500, currency),
    netRevenue: new Money(60000, currency),
  };

  describe('Constructor', () => {
    it('should create revenue distribution with required fields', () => {
      const revenueDistribution = new RevenueDistribution(
        'rd-123',
        'org-456',
        'well-789',
        'partner-101',
        'do-202',
        validProductionMonth,
        validProductionVolumes,
        validRevenueBreakdown,
      );

      expect(revenueDistribution.getId()).toBe('rd-123');
      expect(revenueDistribution.getOrganizationId()).toBe('org-456');
      expect(revenueDistribution.getWellId()).toBe('well-789');
      expect(revenueDistribution.getPartnerId()).toBe('partner-101');
      expect(revenueDistribution.getDivisionOrderId()).toBe('do-202');
      expect(revenueDistribution.getProductionMonth()).toBe(
        validProductionMonth,
      );
      expect(revenueDistribution.getProductionVolumes()).toEqual(
        validProductionVolumes,
      );
      expect(revenueDistribution.getRevenueBreakdown()).toEqual(
        validRevenueBreakdown,
      );
      expect(revenueDistribution.isPaid()).toBe(false);
    });

    it('should create revenue distribution with payment info', () => {
      const paymentInfo: PaymentInfo = {
        checkNumber: 'CHK-001',
        paymentDate: new Date('2024-02-01'),
        paymentMethod: 'check',
      };

      const revenueDistribution = new RevenueDistribution(
        'rd-123',
        'org-456',
        'well-789',
        'partner-101',
        'do-202',
        validProductionMonth,
        validProductionVolumes,
        validRevenueBreakdown,
        paymentInfo,
      );

      expect(revenueDistribution.getPaymentInfo()).toEqual(paymentInfo);
      expect(revenueDistribution.isPaid()).toBe(true);
    });

    it('should create copies of complex objects to prevent external mutation', () => {
      const originalVolumes = { ...validProductionVolumes };
      const originalBreakdown = { ...validRevenueBreakdown };
      const originalPaymentInfo: PaymentInfo = {
        checkNumber: 'CHK-001',
        paymentDate: new Date('2024-02-01'),
        paymentMethod: 'check',
      };

      const revenueDistribution = new RevenueDistribution(
        'rd-123',
        'org-456',
        'well-789',
        'partner-101',
        'do-202',
        validProductionMonth,
        originalVolumes,
        originalBreakdown,
        originalPaymentInfo,
      );

      // Modify original objects
      originalVolumes.oilVolume = 2000;
      originalBreakdown.netRevenue = new Money(70000, currency);
      if (originalPaymentInfo.paymentDate) {
        originalPaymentInfo.paymentDate.setMonth(3);
      }

      // Entity objects should remain unchanged
      expect(revenueDistribution.getProductionVolumes().oilVolume).toBe(1000);
      expect(
        revenueDistribution.getRevenueBreakdown().netRevenue.getAmount(),
      ).toBe(60000);
      expect(revenueDistribution.getPaymentInfo().paymentDate?.getMonth()).toBe(
        1,
      ); // February
    });

    it('should throw error for empty organizationId', () => {
      expect(
        () =>
          new RevenueDistribution(
            'rd-123',
            '',
            'well-789',
            'partner-101',
            'do-202',
            validProductionMonth,
            validProductionVolumes,
            validRevenueBreakdown,
          ),
      ).toThrow('Organization ID is required');
    });

    it('should throw error for empty wellId', () => {
      expect(
        () =>
          new RevenueDistribution(
            'rd-123',
            'org-456',
            '',
            'partner-101',
            'do-202',
            validProductionMonth,
            validProductionVolumes,
            validRevenueBreakdown,
          ),
      ).toThrow('Well ID is required');
    });

    it('should throw error for empty partnerId', () => {
      expect(
        () =>
          new RevenueDistribution(
            'rd-123',
            'org-456',
            'well-789',
            '',
            'do-202',
            validProductionMonth,
            validProductionVolumes,
            validRevenueBreakdown,
          ),
      ).toThrow('Partner ID is required');
    });

    it('should throw error for empty divisionOrderId', () => {
      expect(
        () =>
          new RevenueDistribution(
            'rd-123',
            'org-456',
            'well-789',
            'partner-101',
            '',
            validProductionMonth,
            validProductionVolumes,
            validRevenueBreakdown,
          ),
      ).toThrow('Division Order ID is required');
    });

    it('should throw error for future production month', () => {
      const futureMonth = ProductionMonth.fromDate(new Date('2025-12-01'));

      expect(
        () =>
          new RevenueDistribution(
            'rd-123',
            'org-456',
            'well-789',
            'partner-101',
            'do-202',
            futureMonth,
            validProductionVolumes,
            validRevenueBreakdown,
          ),
      ).toThrow('Production month cannot be in the future');
    });

    it('should throw error for negative total revenue', () => {
      const invalidBreakdown: RevenueBreakdown = {
        ...validRevenueBreakdown,
        totalRevenue: new Money(-1000, currency),
      };

      expect(
        () =>
          new RevenueDistribution(
            'rd-123',
            'org-456',
            'well-789',
            'partner-101',
            'do-202',
            validProductionMonth,
            validProductionVolumes,
            invalidBreakdown,
          ),
      ).toThrow('Total revenue cannot be negative');
    });

    it('should throw error for net revenue exceeding total revenue', () => {
      const invalidBreakdown: RevenueBreakdown = {
        ...validRevenueBreakdown,
        netRevenue: new Money(80000, currency),
      };

      expect(
        () =>
          new RevenueDistribution(
            'rd-123',
            'org-456',
            'well-789',
            'partner-101',
            'do-202',
            validProductionMonth,
            validProductionVolumes,
            invalidBreakdown,
          ),
      ).toThrow('Net revenue cannot exceed total revenue');
    });

    it('should throw error for inconsistent currencies', () => {
      const invalidBreakdown: RevenueBreakdown = {
        ...validRevenueBreakdown,
        oilRevenue: new Money(50000, 'EUR'),
      };

      expect(
        () =>
          new RevenueDistribution(
            'rd-123',
            'org-456',
            'well-789',
            'partner-101',
            'do-202',
            validProductionMonth,
            validProductionVolumes,
            invalidBreakdown,
          ),
      ).toThrow('All revenue amounts must use the same currency');
    });
  });

  describe('Getters', () => {
    let revenueDistribution: RevenueDistribution;

    beforeEach(() => {
      revenueDistribution = new RevenueDistribution(
        'rd-123',
        'org-456',
        'well-789',
        'partner-101',
        'do-202',
        validProductionMonth,
        validProductionVolumes,
        validRevenueBreakdown,
      );
    });

    it('should return correct id', () => {
      expect(revenueDistribution.getId()).toBe('rd-123');
    });

    it('should return correct organizationId', () => {
      expect(revenueDistribution.getOrganizationId()).toBe('org-456');
    });

    it('should return correct wellId', () => {
      expect(revenueDistribution.getWellId()).toBe('well-789');
    });

    it('should return correct partnerId', () => {
      expect(revenueDistribution.getPartnerId()).toBe('partner-101');
    });

    it('should return correct divisionOrderId', () => {
      expect(revenueDistribution.getDivisionOrderId()).toBe('do-202');
    });

    it('should return correct productionMonth', () => {
      expect(revenueDistribution.getProductionMonth()).toBe(
        validProductionMonth,
      );
    });

    it('should return copies of productionVolumes to prevent external mutation', () => {
      const volumes = revenueDistribution.getProductionVolumes();
      volumes.oilVolume = 2000;

      expect(revenueDistribution.getProductionVolumes().oilVolume).toBe(1000);
    });

    it('should return copies of revenueBreakdown to prevent external mutation', () => {
      const breakdown = revenueDistribution.getRevenueBreakdown();
      breakdown.netRevenue = new Money(70000, currency);

      expect(
        revenueDistribution.getRevenueBreakdown().netRevenue.getAmount(),
      ).toBe(60000);
    });

    it('should return copies of paymentInfo to prevent external mutation', () => {
      const paymentInfo: PaymentInfo = {
        checkNumber: 'CHK-001',
        paymentDate: new Date('2024-02-01'),
        paymentMethod: 'check',
      };

      const paidDistribution = new RevenueDistribution(
        'rd-124',
        'org-456',
        'well-789',
        'partner-101',
        'do-202',
        validProductionMonth,
        validProductionVolumes,
        validRevenueBreakdown,
        paymentInfo,
      );

      const returnedPaymentInfo = paidDistribution.getPaymentInfo();
      if (returnedPaymentInfo.paymentDate) {
        returnedPaymentInfo.paymentDate.setMonth(3);
      }

      expect(paidDistribution.getPaymentInfo().paymentDate?.getMonth()).toBe(1);
    });

    it('should return copies of createdAt and updatedAt dates', () => {
      const createdAt = revenueDistribution.getCreatedAt();
      const updatedAt = revenueDistribution.getUpdatedAt();

      createdAt.setFullYear(2023);
      updatedAt.setMonth(5);

      expect(revenueDistribution.getCreatedAt().getFullYear()).not.toBe(2023);
      expect(revenueDistribution.getUpdatedAt().getMonth()).not.toBe(5);
    });

    it('should return correct version', () => {
      expect(revenueDistribution.getVersion()).toBe(1);
    });
  });

  describe('Business Methods', () => {
    let revenueDistribution: RevenueDistribution;

    beforeEach(() => {
      revenueDistribution = new RevenueDistribution(
        'rd-123',
        'org-456',
        'well-789',
        'partner-101',
        'do-202',
        validProductionMonth,
        validProductionVolumes,
        validRevenueBreakdown,
      );
    });

    describe('recalculateRevenue', () => {
      it('should recalculate revenue successfully', () => {
        const newVolumes: ProductionVolumes = {
          oilVolume: 1200,
          gasVolume: 6000,
        };
        const newBreakdown: RevenueBreakdown = {
          ...validRevenueBreakdown,
          oilRevenue: new Money(60000, currency),
          gasRevenue: new Money(30000, currency),
          totalRevenue: new Money(90000, currency),
          netRevenue: new Money(72000, currency),
        };

        revenueDistribution.recalculateRevenue(
          newVolumes,
          newBreakdown,
          'user-123',
        );

        expect(revenueDistribution.getProductionVolumes()).toEqual(newVolumes);
        expect(revenueDistribution.getRevenueBreakdown()).toEqual(newBreakdown);
        expect(revenueDistribution.getVersion()).toBe(2);
      });

      it('should throw error for already paid distribution', () => {
        revenueDistribution.processPayment(
          'CHK-001',
          new Date('2024-02-01'),
          'user-123',
        );

        expect(() =>
          revenueDistribution.recalculateRevenue(
            validProductionVolumes,
            validRevenueBreakdown,
            'user-123',
          ),
        ).toThrow('Cannot recalculate revenue for already paid distribution');
      });

      it('should throw error for invalid revenue breakdown', () => {
        const invalidBreakdown: RevenueBreakdown = {
          ...validRevenueBreakdown,
          netRevenue: new Money(80000, currency),
        };

        expect(() =>
          revenueDistribution.recalculateRevenue(
            validProductionVolumes,
            invalidBreakdown,
            'user-123',
          ),
        ).toThrow('Net revenue cannot exceed total revenue');
      });
    });

    describe('processPayment', () => {
      it('should process payment successfully', () => {
        const paymentDate = new Date('2024-02-01');

        revenueDistribution.processPayment('CHK-001', paymentDate, 'user-123');

        const paymentInfo = revenueDistribution.getPaymentInfo();
        expect(paymentInfo.checkNumber).toBe('CHK-001');
        expect(paymentInfo.paymentDate).toEqual(paymentDate);
        expect(paymentInfo.paymentMethod).toBe('check');
        expect(revenueDistribution.isPaid()).toBe(true);
        expect(revenueDistribution.getVersion()).toBe(2);
      });

      it('should throw error for already paid distribution', () => {
        revenueDistribution.processPayment(
          'CHK-001',
          new Date('2024-02-01'),
          'user-123',
        );

        expect(() =>
          revenueDistribution.processPayment(
            'CHK-002',
            new Date('2024-02-02'),
            'user-123',
          ),
        ).toThrow('Revenue distribution has already been paid');
      });

      it('should throw error for empty check number', () => {
        expect(() =>
          revenueDistribution.processPayment(
            '',
            new Date('2024-02-01'),
            'user-123',
          ),
        ).toThrow('Check number is required for payment processing');
      });

      it('should throw error for future payment date', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);

        expect(() =>
          revenueDistribution.processPayment('CHK-001', futureDate, 'user-123'),
        ).toThrow('Payment date cannot be in the future');
      });
    });

    describe('isPaid', () => {
      it('should return false for unpaid distribution', () => {
        expect(revenueDistribution.isPaid()).toBe(false);
      });

      it('should return true for paid distribution', () => {
        revenueDistribution.processPayment(
          'CHK-001',
          new Date('2024-02-01'),
          'user-123',
        );
        expect(revenueDistribution.isPaid()).toBe(true);
      });
    });

    describe('getNetRevenueAmount', () => {
      it('should return correct net revenue amount', () => {
        expect(revenueDistribution.getNetRevenueAmount()).toEqual(
          validRevenueBreakdown.netRevenue,
        );
      });
    });

    describe('getTotalRevenueAmount', () => {
      it('should return correct total revenue amount', () => {
        expect(revenueDistribution.getTotalRevenueAmount()).toEqual(
          validRevenueBreakdown.totalRevenue,
        );
      });
    });

    describe('getTotalDeductions', () => {
      it('should calculate total deductions correctly', () => {
        const totalDeductions = revenueDistribution.getTotalDeductions();
        expect(totalDeductions.getAmount()).toBe(12750); // 7500 + 2250 + 1500 + 1000 + 500
        expect(totalDeductions.getCurrency()).toBe(currency);
      });

      it('should return zero for no deductions', () => {
        const noDeductionsBreakdown: RevenueBreakdown = {
          totalRevenue: new Money(75000, currency),
          netRevenue: new Money(75000, currency),
        };

        const distribution = new RevenueDistribution(
          'rd-124',
          'org-456',
          'well-789',
          'partner-101',
          'do-202',
          validProductionMonth,
          validProductionVolumes,
          noDeductionsBreakdown,
        );

        expect(distribution.getTotalDeductions().getAmount()).toBe(0);
      });
    });
  });

  describe('Factory Methods', () => {
    describe('create', () => {
      it('should create revenue distribution with generated ID', () => {
        const distribution = RevenueDistribution.create(
          'org-456',
          'well-789',
          'partner-101',
          'do-202',
          validProductionMonth,
          validProductionVolumes,
          validRevenueBreakdown,
        );

        expect(distribution.getId()).toBeDefined();
        expect(typeof distribution.getId()).toBe('string');
        expect(distribution.getId().length).toBeGreaterThan(0);
      });

      it('should create revenue distribution with provided ID', () => {
        const distribution = RevenueDistribution.create(
          'org-456',
          'well-789',
          'partner-101',
          'do-202',
          validProductionMonth,
          validProductionVolumes,
          validRevenueBreakdown,
          { id: 'custom-id' },
        );

        expect(distribution.getId()).toBe('custom-id');
      });

      it('should create revenue distribution with payment info', () => {
        const paymentInfo: PaymentInfo = {
          checkNumber: 'CHK-001',
          paymentDate: new Date('2024-02-01'),
          paymentMethod: 'check',
        };

        const distribution = RevenueDistribution.create(
          'org-456',
          'well-789',
          'partner-101',
          'do-202',
          validProductionMonth,
          validProductionVolumes,
          validRevenueBreakdown,
          { paymentInfo },
        );

        expect(distribution.getPaymentInfo()).toEqual(paymentInfo);
      });
    });

    describe('fromPersistence', () => {
      it('should create revenue distribution from persistence data', () => {
        const persistenceData = {
          id: 'rd-123',
          organizationId: 'org-456',
          wellId: 'well-789',
          partnerId: 'partner-101',
          divisionOrderId: 'do-202',
          productionMonth: new Date('2024-01-01'),
          oilVolume: 1000,
          gasVolume: 5000,
          oilRevenue: 50000,
          gasRevenue: 25000,
          totalRevenue: 75000,
          severanceTax: 7500,
          adValorem: 2250,
          transportationCosts: 1500,
          processingCosts: 1000,
          otherDeductions: 500,
          netRevenue: 60000,
          checkNumber: 'CHK-001',
          paymentDate: new Date('2024-02-01'),
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          version: 1,
        };

        const distribution =
          RevenueDistribution.fromPersistence(persistenceData);

        expect(distribution.getId()).toBe('rd-123');
        expect(distribution.getProductionVolumes()).toEqual({
          oilVolume: 1000,
          gasVolume: 5000,
        });
        expect(
          distribution.getRevenueBreakdown().totalRevenue.getAmount(),
        ).toBe(75000);
        expect(distribution.getPaymentInfo().checkNumber).toBe('CHK-001');
        expect(distribution.getCreatedAt()).toEqual(new Date('2024-01-15'));
        expect(distribution.getVersion()).toBe(1);
      });
    });
  });

  describe('Persistence Methods', () => {
    let revenueDistribution: RevenueDistribution;

    beforeEach(() => {
      revenueDistribution = new RevenueDistribution(
        'rd-123',
        'org-456',
        'well-789',
        'partner-101',
        'do-202',
        validProductionMonth,
        validProductionVolumes,
        validRevenueBreakdown,
      );
    });

    describe('toPersistence', () => {
      it('should convert to persistence format correctly', () => {
        const persistenceData = revenueDistribution.toPersistence();

        expect(persistenceData.id).toBe('rd-123');
        expect(persistenceData.organizationId).toBe('org-456');
        expect(persistenceData.wellId).toBe('well-789');
        expect(persistenceData.partnerId).toBe('partner-101');
        expect(persistenceData.divisionOrderId).toBe('do-202');
        expect(persistenceData.productionMonth).toEqual(
          validProductionMonth.toDatabaseDate(),
        );
        expect(persistenceData.oilVolume).toBe(1000);
        expect(persistenceData.gasVolume).toBe(5000);
        expect(persistenceData.totalRevenue).toBe(75000);
        expect(persistenceData.netRevenue).toBe(60000);
        expect(persistenceData.createdAt).toBeInstanceOf(Date);
        expect(persistenceData.updatedAt).toBeInstanceOf(Date);
        expect(persistenceData.version).toBe(1);
      });

      it('should handle undefined values in persistence', () => {
        const minimalBreakdown: RevenueBreakdown = {
          totalRevenue: new Money(75000, currency),
          netRevenue: new Money(75000, currency),
        };

        const minimalDistribution = new RevenueDistribution(
          'rd-124',
          'org-456',
          'well-789',
          'partner-101',
          'do-202',
          validProductionMonth,
          {},
          minimalBreakdown,
        );

        const persistenceData = minimalDistribution.toPersistence();

        expect(persistenceData.oilVolume).toBeUndefined();
        expect(persistenceData.gasVolume).toBeUndefined();
        expect(persistenceData.oilRevenue).toBeUndefined();
        expect(persistenceData.gasRevenue).toBeUndefined();
        expect(persistenceData.severanceTax).toBeUndefined();
        expect(persistenceData.checkNumber).toBeUndefined();
        expect(persistenceData.paymentDate).toBeUndefined();
      });
    });
  });

  describe('Domain Events', () => {
    it('should collect domain events', () => {
      const distribution = RevenueDistribution.create(
        'org-456',
        'well-789',
        'partner-101',
        'do-202',
        validProductionMonth,
        validProductionVolumes,
        validRevenueBreakdown,
      );

      const events = distribution.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeDefined();
    });

    it('should clear domain events', () => {
      const distribution = RevenueDistribution.create(
        'org-456',
        'well-789',
        'partner-101',
        'do-202',
        validProductionMonth,
        validProductionVolumes,
        validRevenueBreakdown,
      );

      distribution.clearDomainEvents();
      expect(distribution.getDomainEvents()).toHaveLength(0);
    });
  });
});
