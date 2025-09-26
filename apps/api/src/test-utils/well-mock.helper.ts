import { Well } from '../domain/entities/well.entity';
import { ApiNumber } from '../domain/value-objects/api-number';
import { WellStatus, WellType } from '../domain/enums/well-status.enum';

/**
 * Creates a complete mock Well object with all required methods
 * This ensures TypeScript compatibility with jest.Mocked<Well>
 */
export function createMockWell(
  overrides: Partial<{
    id: string;
    apiNumber: string;
    name: string;
    operatorId: string;
    leaseId: string;
    wellType: WellType;
    status: WellStatus;
    location: {
      coordinates: { latitude: number; longitude: number };
      address: string;
      county: string;
      state: string;
      country: string;
    };
    spudDate: Date;
    completionDate: Date;
    totalDepth: number;
    createdAt: Date;
    updatedAt: Date;
    version: number;
    domainEvents: unknown[];
  }> = {},
): jest.Mocked<Well> {
  const defaults = {
    id: 'well-123',
    apiNumber: '42-123-45678',
    name: 'Test Well',
    operatorId: 'operator-123',
    leaseId: 'lease-123',
    wellType: WellType.OIL,
    status: WellStatus.DRILLING,
    location: {
      coordinates: { latitude: 32.7767, longitude: -96.797 },
      address: '123 Test St',
      county: 'Test County',
      state: 'TX',
      country: 'USA',
    },
    spudDate: new Date('2024-01-01'),
    completionDate: new Date('2024-02-01'),
    totalDepth: 5000,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    version: 1,
    domainEvents: [],
  };

  const mockData = { ...defaults, ...overrides };

  return {
    getId: jest.fn().mockReturnValue({ getValue: () => mockData.id }),
    getApiNumber: jest.fn().mockReturnValue(new ApiNumber(mockData.apiNumber)),
    getName: jest.fn().mockReturnValue(mockData.name),
    getOperatorId: jest.fn().mockReturnValue(mockData.operatorId),
    getLeaseId: jest.fn().mockReturnValue(mockData.leaseId),
    getWellType: jest.fn().mockReturnValue(mockData.wellType),
    getStatus: jest.fn().mockReturnValue(mockData.status),
    getLocation: jest.fn().mockReturnValue({
      toObject: jest.fn().mockReturnValue(mockData.location),
      getCoordinates: jest.fn().mockReturnValue({
        toObject: jest.fn().mockReturnValue(mockData.location.coordinates),
      }),
      getAddress: jest.fn().mockReturnValue(mockData.location.address),
      getCounty: jest.fn().mockReturnValue(mockData.location.county),
      getState: jest.fn().mockReturnValue(mockData.location.state),
      getCountry: jest.fn().mockReturnValue(mockData.location.country),
    }),
    getSpudDate: jest.fn().mockReturnValue(mockData.spudDate),
    getCompletionDate: jest.fn().mockReturnValue(mockData.completionDate),
    getTotalDepth: jest.fn().mockReturnValue(mockData.totalDepth),
    getCreatedAt: jest.fn().mockReturnValue(mockData.createdAt),
    getUpdatedAt: jest.fn().mockReturnValue(mockData.updatedAt),
    getVersion: jest.fn().mockReturnValue(mockData.version),
    updateStatus: jest.fn(),
    updateName: jest.fn(),
    setSpudDate: jest.fn(),
    setCompletionDate: jest.fn(),
    setTotalDepth: jest.fn(),
    getDomainEvents: jest.fn().mockReturnValue(mockData.domainEvents),
    clearDomainEvents: jest.fn(),
  } as unknown as jest.Mocked<Well>;
}

/**
 * Creates a minimal mock Well object with only essential methods
 */
export function createMinimalMockWell(
  overrides: Partial<{
    id: string;
    apiNumber: string;
    name: string;
    operatorId: string;
    wellType: WellType;
    status: WellStatus;
  }> = {},
): jest.Mocked<Well> {
  const defaults = {
    id: 'well-minimal',
    apiNumber: '42-123-00000',
    name: 'Minimal Well',
    operatorId: 'operator-123',
    wellType: WellType.OIL,
    status: WellStatus.DRILLING,
  };

  const mockData = { ...defaults, ...overrides };

  return {
    getId: jest.fn().mockReturnValue({ getValue: () => mockData.id }),
    getApiNumber: jest.fn().mockReturnValue(new ApiNumber(mockData.apiNumber)),
    getName: jest.fn().mockReturnValue(mockData.name),
    getOperatorId: jest.fn().mockReturnValue(mockData.operatorId),
    getLeaseId: jest.fn().mockReturnValue(null),
    getWellType: jest.fn().mockReturnValue(mockData.wellType),
    getStatus: jest.fn().mockReturnValue(mockData.status),
    getLocation: jest.fn().mockReturnValue(null),
    getSpudDate: jest.fn().mockReturnValue(null),
    getCompletionDate: jest.fn().mockReturnValue(null),
    getTotalDepth: jest.fn().mockReturnValue(null),
    getCreatedAt: jest.fn().mockReturnValue(new Date('2024-02-01T10:00:00Z')),
    getUpdatedAt: jest.fn().mockReturnValue(new Date('2024-02-01T10:00:00Z')),
    getVersion: jest.fn().mockReturnValue(1),
    updateStatus: jest.fn(),
    updateName: jest.fn(),
    setSpudDate: jest.fn(),
    setCompletionDate: jest.fn(),
    setTotalDepth: jest.fn(),
    getDomainEvents: jest.fn().mockReturnValue([]),
    clearDomainEvents: jest.fn(),
  } as unknown as jest.Mocked<Well>;
}

/**
 * Creates an array of mock Well objects
 */
export function createMockWellArray(
  count: number,
  baseOverrides: Partial<{
    id: string;
    apiNumber: string;
    name: string;
    operatorId: string;
    leaseId: string;
    wellType: WellType;
    status: WellStatus;
  }> = {},
): jest.Mocked<Well>[] {
  return Array.from({ length: count }, (_, index) =>
    createMockWell({
      id: `well-${index + 1}`,
      name: `Test Well #${index + 1}`,
      ...baseOverrides,
    }),
  );
}
