import { AfeDto } from '../afe.dto';
import { AfeType, AfeStatus } from '../../../domain/enums/afe-status.enum';

// Mock Afe entity for testing
class MockAfe {
  getId() {
    return 'afe-123';
  }
  getOrganizationId() {
    return 'org-456';
  }
  getAfeNumber() {
    return { getValue: () => 'AFE-2024-0001' };
  }
  getWellId() {
    return 'well-789';
  }
  getLeaseId() {
    return 'lease-101';
  }
  getAfeType() {
    return AfeType.DRILLING;
  }
  getStatus() {
    return AfeStatus.APPROVED;
  }
  getTotalEstimatedCost() {
    return { toJSON: () => ({ amount: 1000000, currency: 'USD' }) };
  }
  getApprovedAmount() {
    return { toJSON: () => ({ amount: 950000, currency: 'USD' }) };
  }
  getActualCost() {
    return { toJSON: () => ({ amount: 920000, currency: 'USD' }) };
  }
  getEffectiveDate() {
    return new Date('2024-01-01');
  }
  getApprovalDate() {
    return new Date('2024-01-15');
  }
  getDescription() {
    return 'Drilling operations';
  }
  getCreatedAt() {
    return new Date('2024-01-01T00:00:00Z');
  }
  getUpdatedAt() {
    return new Date('2024-01-15T00:00:00Z');
  }
  getVersion() {
    return 1;
  }
}

describe('AfeDto', () => {
  let mockAfe: MockAfe;

  beforeEach(() => {
    mockAfe = new MockAfe();
  });

  describe('constructor', () => {
    it('should create DTO with provided data', () => {
      const data = {
        id: 'test-id',
        organizationId: 'test-org',
        afeNumber: 'AFE-TEST',
        afeType: AfeType.COMPLETION,
        status: AfeStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };

      const dto = new AfeDto(data);

      expect(dto.id).toBe('test-id');
      expect(dto.organizationId).toBe('test-org');
      expect(dto.afeNumber).toBe('AFE-TEST');
      expect(dto.afeType).toBe(AfeType.COMPLETION);
      expect(dto.status).toBe(AfeStatus.DRAFT);
      expect(dto.version).toBe(1);
    });

    it('should handle partial data', () => {
      const data = { id: 'partial-id' };
      const dto = new AfeDto(data);

      expect(dto.id).toBe('partial-id');
      expect(dto.organizationId).toBeUndefined();
    });

    it('should handle empty data', () => {
      const dto = new AfeDto({});

      expect(dto.id).toBeUndefined();
      expect(dto.afeNumber).toBeUndefined();
    });
  });

  describe('fromEntity', () => {
    it('should create DTO from Afe entity', () => {
      const dto = AfeDto.fromEntity(mockAfe as any);

      expect(dto.id).toBe('afe-123');
      expect(dto.organizationId).toBe('org-456');
      expect(dto.afeNumber).toBe('AFE-2024-0001');
      expect(dto.wellId).toBe('well-789');
      expect(dto.leaseId).toBe('lease-101');
      expect(dto.afeType).toBe(AfeType.DRILLING);
      expect(dto.status).toBe(AfeStatus.APPROVED);
      expect(dto.totalEstimatedCost).toEqual({
        amount: 1000000,
        currency: 'USD',
      });
      expect(dto.approvedAmount).toEqual({ amount: 950000, currency: 'USD' });
      expect(dto.actualCost).toEqual({ amount: 920000, currency: 'USD' });
      expect(dto.effectiveDate).toEqual(new Date('2024-01-01'));
      expect(dto.approvalDate).toEqual(new Date('2024-01-15'));
      expect(dto.description).toBe('Drilling operations');
      expect(dto.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(dto.updatedAt).toEqual(new Date('2024-01-15T00:00:00Z'));
      expect(dto.version).toBe(1);
    });

    it('should handle entity with null optional fields', () => {
      const mockAfeWithNulls = {
        getId: () => 'afe-123',
        getOrganizationId: () => 'org-456',
        getAfeNumber: () => ({ getValue: () => 'AFE-2024-0001' }),
        getWellId: () => null,
        getLeaseId: () => null,
        getAfeType: () => AfeType.DRILLING,
        getStatus: () => AfeStatus.APPROVED,
        getTotalEstimatedCost: () => null,
        getApprovedAmount: () => null,
        getActualCost: () => null,
        getEffectiveDate: () => null,
        getApprovalDate: () => null,
        getDescription: () => null,
        getCreatedAt: () => new Date('2024-01-01T00:00:00Z'),
        getUpdatedAt: () => new Date('2024-01-15T00:00:00Z'),
        getVersion: () => 1,
      };

      const dto = AfeDto.fromEntity(mockAfeWithNulls as any);

      expect(dto.wellId).toBeNull();
      expect(dto.leaseId).toBeNull();
      expect(dto.totalEstimatedCost).toBeUndefined();
      expect(dto.approvedAmount).toBeUndefined();
      expect(dto.actualCost).toBeUndefined();
      expect(dto.effectiveDate).toBeNull();
      expect(dto.approvalDate).toBeNull();
      expect(dto.description).toBeNull();
    });
  });

  describe('fromEntities', () => {
    it('should create multiple DTOs from Afe entities', () => {
      const mockAfes = [mockAfe, mockAfe] as any[];
      const dtos = AfeDto.fromEntities(mockAfes);

      expect(dtos).toHaveLength(2);
      expect(dtos[0]).toBeInstanceOf(AfeDto);
      expect(dtos[1]).toBeInstanceOf(AfeDto);
      expect(dtos[0]!.id).toBe('afe-123');
      expect(dtos[1]!.id).toBe('afe-123');
    });

    it('should handle empty array', () => {
      const dtos = AfeDto.fromEntities([]);
      expect(dtos).toHaveLength(0);
    });
  });

  describe('structure', () => {
    it('should have all required properties', () => {
      const dto = new AfeDto({});
      expect(dto).toHaveProperty('id');
      expect(dto).toHaveProperty('organizationId');
      expect(dto).toHaveProperty('afeNumber');
      expect(dto).toHaveProperty('afeType');
      expect(dto).toHaveProperty('status');
      expect(dto).toHaveProperty('createdAt');
      expect(dto).toHaveProperty('updatedAt');
      expect(dto).toHaveProperty('version');
    });

    it('should have optional properties', () => {
      const dto = new AfeDto({});
      expect(dto).toHaveProperty('wellId');
      expect(dto).toHaveProperty('leaseId');
      expect(dto).toHaveProperty('totalEstimatedCost');
      expect(dto).toHaveProperty('approvedAmount');
      expect(dto).toHaveProperty('actualCost');
      expect(dto).toHaveProperty('effectiveDate');
      expect(dto).toHaveProperty('approvalDate');
      expect(dto).toHaveProperty('description');
    });
  });

  describe('data types', () => {
    it('should handle cost objects correctly', () => {
      const dto = new AfeDto({
        totalEstimatedCost: { amount: 500000, currency: 'EUR' },
        approvedAmount: { amount: 450000, currency: 'EUR' },
        actualCost: { amount: 480000, currency: 'EUR' },
      });

      expect(dto.totalEstimatedCost!.amount).toBe(500000);
      expect(dto.totalEstimatedCost!.currency).toBe('EUR');
      expect(dto.approvedAmount!.amount).toBe(450000);
      expect(dto.actualCost!.amount).toBe(480000);
    });

    it('should handle date objects', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      const dto = new AfeDto({ createdAt, updatedAt });

      expect(dto.createdAt).toBe(createdAt);
      expect(dto.updatedAt).toBe(updatedAt);
    });
  });
});
