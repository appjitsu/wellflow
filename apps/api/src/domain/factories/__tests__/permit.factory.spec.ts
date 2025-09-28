import { Test, TestingModule } from '@nestjs/testing';
import { PermitFactory, PermitCreationInput } from '../permit.factory';
import { Permit } from '../../entities/permit.entity';
import { PermitType } from '../../value-objects/permit-type.vo';
import { PermitStatus } from '../../value-objects/permit-status.vo';

// Mock the Permit entity
jest.mock('../../entities/permit.entity');

describe('PermitFactory', () => {
  let factory: PermitFactory;
  let mockPermitInstance: jest.Mocked<Permit>;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a mock permit instance
    mockPermitInstance = {
      id: 'permit-123',
      permitNumber: 'PERMIT-001',
      permitType: PermitType.DRILLING,
      status: PermitStatus.DRAFT,
      organizationId: 'org-123',
      issuingAgency: 'EPA',
      createdByUserId: 'user-456',
      regulatoryAuthority: undefined,
      wellId: undefined,
      facilityId: undefined,
      location: undefined,
      applicationDate: undefined,
      submittedDate: undefined,
      approvalDate: undefined,
      expirationDate: undefined,
      permitConditions: undefined,
      complianceRequirements: undefined,
      feeAmount: undefined,
      bondAmount: undefined,
      bondType: undefined,
      documentIds: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as jest.Mocked<Permit>;

    // Mock property setters
    Object.defineProperty(mockPermitInstance, 'regulatoryAuthority', {
      set: jest.fn(),
      get: jest.fn(() => undefined),
    });
    Object.defineProperty(mockPermitInstance, 'wellId', {
      set: jest.fn(),
      get: jest.fn(() => undefined),
    });
    Object.defineProperty(mockPermitInstance, 'facilityId', {
      set: jest.fn(),
      get: jest.fn(() => undefined),
    });
    Object.defineProperty(mockPermitInstance, 'location', {
      set: jest.fn(),
      get: jest.fn(() => undefined),
    });
    Object.defineProperty(mockPermitInstance, 'applicationDate', {
      set: jest.fn(),
      get: jest.fn(() => undefined),
    });
    Object.defineProperty(mockPermitInstance, 'expirationDate', {
      set: jest.fn(),
      get: jest.fn(() => undefined),
    });
    Object.defineProperty(mockPermitInstance, 'permitConditions', {
      set: jest.fn(),
      get: jest.fn(() => undefined),
    });
    Object.defineProperty(mockPermitInstance, 'complianceRequirements', {
      set: jest.fn(),
      get: jest.fn(() => undefined),
    });
    Object.defineProperty(mockPermitInstance, 'feeAmount', {
      set: jest.fn(),
      get: jest.fn(() => undefined),
    });
    Object.defineProperty(mockPermitInstance, 'bondAmount', {
      set: jest.fn(),
      get: jest.fn(() => undefined),
    });
    Object.defineProperty(mockPermitInstance, 'bondType', {
      set: jest.fn(),
      get: jest.fn(() => undefined),
    });
    Object.defineProperty(mockPermitInstance, 'documentIds', {
      set: jest.fn(),
      get: jest.fn(() => undefined),
    });
    Object.defineProperty(mockPermitInstance, 'createdAt', {
      set: jest.fn(),
      get: jest.fn(() => new Date()),
    });
    Object.defineProperty(mockPermitInstance, 'updatedAt', {
      set: jest.fn(),
      get: jest.fn(() => new Date()),
    });

    // Mock the static create method
    jest.spyOn(Permit, 'create').mockReturnValue(mockPermitInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [PermitFactory],
    }).compile();

    factory = module.get<PermitFactory>(PermitFactory);
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
  });

  describe('create', () => {
    const validInput: PermitCreationInput = {
      organizationId: 'org-123',
      permitNumber: 'PERMIT-001',
      permitType: 'drilling',
      issuingAgency: 'EPA',
      createdByUserId: 'user-456',
    };

    it('should create a permit successfully with minimal required fields', async () => {
      const result = await factory.create(validInput);

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockPermitInstance);
      expect(Permit.create).toHaveBeenCalledWith(
        'PERMIT-001',
        PermitType.DRILLING,
        'org-123',
        'EPA',
        'user-456',
      );
    });

    it('should create a permit with all optional fields', async () => {
      const inputWithOptionals: PermitCreationInput = {
        ...validInput,
        regulatoryAuthority: 'State Authority',
        expirationDate: new Date('2026-01-01'),
      };

      const result = await factory.create(inputWithOptionals);

      expect(result.success).toBe(true);
      expect(Permit.create).toHaveBeenCalledWith(
        'PERMIT-001',
        PermitType.DRILLING,
        'org-123',
        'EPA',
        'user-456',
      );
    });

    it('should handle location as object properly', async () => {
      const inputWithLocation: PermitCreationInput = {
        ...validInput,
        location: { address: 'Location String' },
      };

      const result = await factory.create(inputWithLocation);

      expect(result.success).toBe(true);
      expect(Permit.create).toHaveBeenCalledWith(
        'PERMIT-001',
        PermitType.DRILLING,
        'org-123',
        'EPA',
        'user-456',
      );
    });

    it('should return validation errors for invalid input', async () => {
      const invalidInput: PermitCreationInput = {
        organizationId: '',
        permitNumber: '',
        permitType: '',
        issuingAgency: '',
        createdByUserId: '',
      };

      const result = await factory.create(invalidInput);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Organization ID is required');
      expect(result.errors).toContain('Permit number is required');
      expect(result.errors).toContain('Permit type is required');
      expect(result.errors).toContain('Issuing agency is required');
      expect(result.errors).toContain('Created by user ID is required');
    });

    it('should return validation errors for business rule violations', async () => {
      const invalidInput: PermitCreationInput = {
        ...validInput,
        permitNumber: 'AB', // Too short
        expirationDate: new Date('2020-01-01'), // Past date
        applicationDate: new Date('2024-01-01'),
        feeAmount: -100, // Negative
        bondAmount: -500, // Negative
      };

      const result = await factory.create(invalidInput);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Permit number must be at least 3 characters long',
      );
      expect(result.errors).toContain('Expiration date must be in the future');
      expect(result.errors).toContain(
        'Application date must be before expiration date',
      );
      expect(result.errors).toContain('Fee amount cannot be negative');
      expect(result.errors).toContain('Bond amount cannot be negative');
    });

    it('should return warnings for missing recommended fields', async () => {
      const result = await factory.validate(validInput);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'Regulatory authority is recommended for complete permit tracking',
      );
      expect(result.warnings).toContain(
        'Expiration date is recommended for compliance monitoring',
      );
      expect(result.warnings).toContain(
        'Compliance requirements are recommended for regulatory compliance',
      );
    });

    it('should handle permit type creation errors', async () => {
      const inputWithInvalidType: PermitCreationInput = {
        ...validInput,
        permitType: 'invalid-type',
      };

      const result = await factory.create(inputWithInvalidType);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Permit type error: Invalid permit type: invalid-type',
      );
    });

    it('should handle unexpected errors during creation', async () => {
      jest.spyOn(Permit, 'create').mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await factory.create(validInput);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Database connection failed');
    });
  });

  describe('createWithDefaults', () => {
    it('should merge input with defaults', async () => {
      const partialInput = {
        permitNumber: 'PERMIT-002',
        issuingAgency: 'State Agency',
      };

      const defaults = {
        organizationId: 'default-org',
        permitType: 'completion',
        createdByUserId: 'default-user',
      };

      const result = await factory.createWithDefaults(partialInput, defaults);

      expect(result.success).toBe(true);
      expect(Permit.create).toHaveBeenCalledWith(
        'PERMIT-002',
        PermitType.COMPLETION,
        'default-org',
        'State Agency',
        'default-user',
      );
    });

    it('should override defaults with provided values', async () => {
      const input = {
        organizationId: 'override-org',
        permitNumber: 'PERMIT-003',
        permitType: 'drilling',
        issuingAgency: 'EPA',
        createdByUserId: 'override-user',
      };

      const defaults = {
        organizationId: 'default-org',
        permitType: 'completion',
        createdByUserId: 'default-user',
      };

      const result = await factory.createWithDefaults(input, defaults);

      expect(result.success).toBe(true);
      expect(Permit.create).toHaveBeenCalledWith(
        'PERMIT-003',
        PermitType.DRILLING,
        'override-org',
        'EPA',
        'override-user',
      );
    });
  });

  describe('reconstructFromState', () => {
    const validState = {
      id: 'permit-123',
      organizationId: 'org-123',
      permitNumber: 'PERMIT-001',
      permitType: 'drilling',
      issuingAgency: 'EPA',
      status: 'approved',
      createdByUserId: 'user-456',
      regulatoryAuthority: 'State Authority',
      wellId: 'well-789',
      facilityId: 'facility-101',
      location: { lat: 40.7128, lng: -74.006 },
      applicationDate: new Date('2023-01-01'),
      submittedDate: new Date('2023-01-15'),
      approvalDate: new Date('2023-02-01'),
      expirationDate: new Date('2026-01-01'),
      permitConditions: { condition: 'test' },
      complianceRequirements: { requirement: 'test' },
      feeAmount: 1000,
      bondAmount: 5000,
      bondType: 'surety',
      documentIds: ['doc-1', 'doc-2'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-02-01'),
    };

    it('should reconstruct permit from state successfully', async () => {
      const result = await factory.reconstructFromState(validState);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Permit);
      // Verify that all properties are set correctly
      expect(result.data!.regulatoryAuthority).toBe('State Authority');
      expect(result.data!.wellId).toBe('well-789');
      expect(result.data!.facilityId).toBe('facility-101');
      expect(result.data!.location).toBe('{"lat":40.7128,"lng":-74.006}');
      expect(result.data!.applicationDate).toBeInstanceOf(Date);
      expect(result.data!.expirationDate).toBeInstanceOf(Date);
      expect(result.data!.createdAt).toBeInstanceOf(Date);
      expect(result.data!.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle string location in state', async () => {
      const stateWithStringLocation = {
        ...validState,
        location: 'Location String',
      };

      const result = await factory.reconstructFromState(
        stateWithStringLocation,
      );

      expect(result.success).toBe(true);
      expect(result.data!.location).toBe('Location String');
    });

    it('should return error for invalid permit type in state', async () => {
      const invalidState = {
        ...validState,
        permitType: 'invalid-type',
      };

      const result = await factory.reconstructFromState(invalidState);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Permit type error: Invalid permit type: invalid-type',
      );
    });

    it('should return error for invalid status in state', async () => {
      const invalidState = {
        ...validState,
        status: 'invalid-status',
      };

      const result = await factory.reconstructFromState(invalidState);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Permit status error: Invalid permit status: invalid-status',
      );
    });

    it('should handle reconstruction errors', async () => {
      const invalidState = {
        ...validState,
        permitType: 'invalid', // Invalid permit type
      };

      const result = await factory.reconstructFromState(invalidState);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Permit type error: Invalid permit type: invalid',
      );
    });
  });

  describe('validate', () => {
    it('should validate successfully with all required fields', async () => {
      const validInput: PermitCreationInput = {
        organizationId: 'org-123',
        permitNumber: 'PERMIT-001',
        permitType: 'drilling',
        issuingAgency: 'EPA',
        createdByUserId: 'user-456',
      };

      const result = await factory.validate(validInput);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.warnings).toBeDefined();
    });

    it('should return errors for missing required fields', async () => {
      const invalidInput = {} as PermitCreationInput;

      const result = await factory.validate(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Organization ID is required');
      expect(result.errors).toContain('Permit number is required');
      expect(result.errors).toContain('Permit type is required');
      expect(result.errors).toContain('Issuing agency is required');
      expect(result.errors).toContain('Created by user ID is required');
    });

    it('should validate business rules', async () => {
      const invalidInput: PermitCreationInput = {
        organizationId: 'org-123',
        permitNumber: 'AB', // Too short
        permitType: 'drilling',
        issuingAgency: 'EPA',
        createdByUserId: 'user-456',
        expirationDate: new Date('2020-01-01'), // Past
        applicationDate: new Date('2024-01-01'), // After expiration
        feeAmount: -100,
        bondAmount: -500,
      };

      const result = await factory.validate(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Permit number must be at least 3 characters long',
      );
      expect(result.errors).toContain('Expiration date must be in the future');
      expect(result.errors).toContain(
        'Application date must be before expiration date',
      );
      expect(result.errors).toContain('Fee amount cannot be negative');
      expect(result.errors).toContain('Bond amount cannot be negative');
    });

    it('should return warnings for missing recommended fields', async () => {
      const minimalInput: PermitCreationInput = {
        organizationId: 'org-123',
        permitNumber: 'PERMIT-001',
        permitType: 'drilling',
        issuingAgency: 'EPA',
        createdByUserId: 'user-456',
      };

      const result = await factory.validate(minimalInput);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'Regulatory authority is recommended for complete permit tracking',
      );
      expect(result.warnings).toContain(
        'Expiration date is recommended for compliance monitoring',
      );
      expect(result.warnings).toContain(
        'Compliance requirements are recommended for regulatory compliance',
      );
    });
  });

  describe('getMetadata', () => {
    it('should return factory metadata', () => {
      const metadata = factory.getMetadata();

      expect(metadata).toEqual({
        factoryType: 'PermitFactory',
        supportedTypes: ['Permit', 'PermitAggregate'],
        version: '1.0.0',
      });
    });
  });

  describe('createWithRelated', () => {
    it('should create permit when no related data provided', async () => {
      const input: PermitCreationInput = {
        organizationId: 'org-123',
        permitNumber: 'PERMIT-001',
        permitType: 'drilling',
        issuingAgency: 'EPA',
        createdByUserId: 'user-456',
      };

      const result = await factory.createWithRelated(input, {});

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockPermitInstance);
    });

    it('should return error when related data is provided', async () => {
      const input: PermitCreationInput = {
        organizationId: 'org-123',
        permitNumber: 'PERMIT-001',
        permitType: 'drilling',
        issuingAgency: 'EPA',
        createdByUserId: 'user-456',
      };

      const result = await factory.createWithRelated(input, {
        related: 'data',
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Related data creation not yet implemented',
      );
    });
  });

  describe('createFromExisting', () => {
    it('should create permit from existing data', async () => {
      const input: PermitCreationInput = {
        organizationId: 'org-123',
        permitNumber: 'PERMIT-001',
        permitType: 'drilling',
        issuingAgency: 'EPA',
        createdByUserId: 'user-456',
      };

      const existingData = {
        id: 'existing-id',
        status: 'approved',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-02-01'),
      };

      const result = await factory.createFromExisting(input, existingData);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Permit);
      expect(result.data!.createdAt).toBeInstanceOf(Date);
      expect(result.data!.updatedAt).toBeInstanceOf(Date);
    });
  });
});
