import { Test, TestingModule } from '@nestjs/testing';
import {
  PermitTypeFactory,
  PermitStatusFactory,
} from '../value-object.factory';
import { PermitType } from '../../value-objects/permit-type.vo';
import { PermitStatus } from '../../value-objects/permit-status.vo';

describe('PermitTypeFactory', () => {
  let factory: PermitTypeFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermitTypeFactory],
    }).compile();

    factory = module.get<PermitTypeFactory>(PermitTypeFactory);
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
  });

  describe('create', () => {
    it('should create a permit type successfully', async () => {
      const result = await factory.create('drilling');

      expect(result.success).toBe(true);
      expect(result.data).toBe(PermitType.DRILLING);
    });

    it('should return error for invalid permit type', async () => {
      const result = await factory.create('invalid-type');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid permit type: invalid-type');
    });
  });

  describe('validate', () => {
    it('should validate successfully for valid permit type', async () => {
      const result = await factory.validate('drilling');

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return error for empty input', async () => {
      const result = await factory.validate('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Permit type cannot be empty');
    });

    it('should return error for invalid permit type', async () => {
      const result = await factory.validate('invalid');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid permit type: invalid');
    });
  });

  describe('fromString', () => {
    it('should create permit type from valid string', async () => {
      const result = await factory.fromString('completion');

      expect(result.success).toBe(true);
      expect(result.data).toBe(PermitType.COMPLETION);
    });

    it('should return error for invalid string', async () => {
      const result = await factory.fromString('bad-type');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid permit type: bad-type');
    });
  });

  describe('fromValues', () => {
    it('should create permit type from values array', async () => {
      const result = await factory.fromValues('workover');

      expect(result.success).toBe(true);
      expect(result.data).toBe(PermitType.WORKOVER);
    });
  });

  describe('getPossibleValues', () => {
    it('should return all possible permit type values', async () => {
      const values = await factory.getPossibleValues();

      expect(values).toEqual([
        'drilling',
        'completion',
        'production',
        'injection',
        'disposal',
        'transportation',
        'storage',
        'processing',
      ]);
    });
  });

  describe('getMetadata', () => {
    it('should return factory metadata', () => {
      const metadata = factory.getMetadata();

      expect(metadata).toEqual({
        factoryType: 'PermitTypeFactory',
        supportedTypes: ['PermitType'],
        version: '1.0.0',
      });
    });
  });
});

describe('PermitStatusFactory', () => {
  let factory: PermitStatusFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermitStatusFactory],
    }).compile();

    factory = module.get<PermitStatusFactory>(PermitStatusFactory);
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
  });

  describe('create', () => {
    it('should create a permit status successfully', async () => {
      const result = await factory.create('approved');

      expect(result.success).toBe(true);
      expect(result.data).toBe(PermitStatus.APPROVED);
    });

    it('should return error for invalid permit status', async () => {
      const result = await factory.create('invalid-status');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid permit status: invalid-status');
    });
  });

  describe('validate', () => {
    it('should validate successfully for valid permit status', async () => {
      const result = await factory.validate('submitted');

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return error for empty input', async () => {
      const result = await factory.validate('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Permit status cannot be empty');
    });

    it('should return error for invalid permit status', async () => {
      const result = await factory.validate('bad-status');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid permit status: bad-status');
    });
  });

  describe('fromString', () => {
    it('should create permit status from valid string', async () => {
      const result = await factory.fromString('under_review');

      expect(result.success).toBe(true);
      expect(result.data).toBe(PermitStatus.UNDER_REVIEW);
    });

    it('should return error for invalid string', async () => {
      const result = await factory.fromString('wrong-status');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid permit status: wrong-status');
    });
  });

  describe('fromValues', () => {
    it('should create permit status from values array', async () => {
      const result = await factory.fromValues('denied');

      expect(result.success).toBe(true);
      expect(result.data).toBe(PermitStatus.DENIED);
    });
  });

  describe('getPossibleValues', () => {
    it('should return all possible permit status values', async () => {
      const values = await factory.getPossibleValues();

      expect(values).toEqual([
        'draft',
        'submitted',
        'under_review',
        'approved',
        'rejected',
        'expired',
        'revoked',
        'suspended',
      ]);
    });
  });

  describe('getMetadata', () => {
    it('should return factory metadata', () => {
      const metadata = factory.getMetadata();

      expect(metadata).toEqual({
        factoryType: 'PermitStatusFactory',
        supportedTypes: ['PermitStatus'],
        version: '1.0.0',
      });
    });
  });
});
