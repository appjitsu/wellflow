import { Test, TestingModule } from '@nestjs/testing';
import { AddChainOfTitleEntryHandler } from '../add-chain-of-title-entry.handler';
import { AddChainOfTitleEntryCommand } from '../../commands/add-chain-of-title-entry.command';
import { ChainOfTitleRepository } from '../../../domain/repositories/chain-of-title.repository.interface';
import { ChainOfTitleEntry } from '../../../domain/entities/chain-of-title-entry.entity';

// Mock randomUUID
jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));
const mockRandomUUID = require('crypto').randomUUID;

// Mock ChainOfTitleEntry
jest.mock('../../../domain/entities/chain-of-title-entry.entity');
const MockChainOfTitleEntry = ChainOfTitleEntry as jest.MockedClass<
  typeof ChainOfTitleEntry
>;

describe('AddChainOfTitleEntryHandler', () => {
  let handler: AddChainOfTitleEntryHandler;
  let chainOfTitleRepository: jest.Mocked<ChainOfTitleRepository>;

  const mockRecordingInfo = {
    county: 'Harris',
    state: 'TX',
    volume: '123',
    page: '456',
    docNumber: 'DOC-789',
    instrumentNumber: 'INST-101',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockRandomUUID.mockReturnValue('entry-123');

    const mockChainOfTitleRepository = {
      addEntry: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddChainOfTitleEntryHandler,
        {
          provide: 'ChainOfTitleRepository',
          useValue: mockChainOfTitleRepository,
        },
      ],
    }).compile();

    handler = module.get<AddChainOfTitleEntryHandler>(
      AddChainOfTitleEntryHandler,
    );
    chainOfTitleRepository = module.get('ChainOfTitleRepository');
  });

  describe('execute', () => {
    const validCommand = new AddChainOfTitleEntryCommand(
      'org-123',
      'lease-456',
      'DEED',
      new Date('2023-01-15'),
      'John Doe',
      'Jane Smith',
      'Legal description reference',
      mockRecordingInfo,
      'Additional notes',
    );

    it('should successfully add a chain of title entry', async () => {
      // Arrange
      const mockEntry = {
        getId: jest.fn().mockReturnValue('entry-123'),
      };
      MockChainOfTitleEntry.mockImplementation(() => mockEntry as any);
      chainOfTitleRepository.addEntry.mockResolvedValue(mockEntry as any);

      // Act
      const result = await handler.execute(validCommand);

      // Assert
      expect(result).toBe('entry-123');
      expect(MockChainOfTitleEntry).toHaveBeenCalledWith({
        id: 'entry-123',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        instrumentType: 'DEED',
        instrumentDate: new Date('2023-01-15'),
        grantor: 'John Doe',
        grantee: 'Jane Smith',
        legalDescriptionRef: 'Legal description reference',
        recordingInfo: mockRecordingInfo,
        notes: 'Additional notes',
      });
      expect(chainOfTitleRepository.addEntry).toHaveBeenCalledWith(mockEntry);
    });

    it('should create entry with minimal required fields', async () => {
      // Arrange
      const minimalCommand = new AddChainOfTitleEntryCommand(
        'org-123',
        'lease-456',
        'ASSIGNMENT',
        new Date('2023-01-15'),
        'Grantor Corp',
        'Grantee LLC',
      );

      const mockEntry = {
        getId: jest.fn().mockReturnValue('entry-123'),
      };
      MockChainOfTitleEntry.mockImplementation(() => mockEntry as any);
      chainOfTitleRepository.addEntry.mockResolvedValue(mockEntry as any);

      // Act
      const result = await handler.execute(minimalCommand);

      // Assert
      expect(result).toBe('entry-123');
      expect(MockChainOfTitleEntry).toHaveBeenCalledWith({
        id: 'entry-123',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        instrumentType: 'ASSIGNMENT',
        instrumentDate: new Date('2023-01-15'),
        grantor: 'Grantor Corp',
        grantee: 'Grantee LLC',
        legalDescriptionRef: undefined,
        recordingInfo: undefined,
        notes: undefined,
      });
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const mockEntry = {
        getId: jest.fn().mockReturnValue('entry-123'),
      };
      MockChainOfTitleEntry.mockImplementation(() => mockEntry as any);
      const repositoryError = new Error('Database connection failed');
      chainOfTitleRepository.addEntry.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Database connection failed',
      );

      expect(chainOfTitleRepository.addEntry).toHaveBeenCalledWith(mockEntry);
    });

    it('should generate unique IDs for each entry', async () => {
      // Arrange
      const command1 = new AddChainOfTitleEntryCommand(
        'org-123',
        'lease-456',
        'DEED',
        new Date('2023-01-15'),
        'Grantor 1',
        'Grantee 1',
      );

      const command2 = new AddChainOfTitleEntryCommand(
        'org-123',
        'lease-456',
        'ASSIGNMENT',
        new Date('2023-02-15'),
        'Grantor 2',
        'Grantee 2',
      );

      const mockEntry1 = {
        getId: jest.fn().mockReturnValue('entry-123'),
      };
      const mockEntry2 = {
        getId: jest.fn().mockReturnValue('entry-456'),
      };

      MockChainOfTitleEntry.mockImplementationOnce(
        () => mockEntry1 as any,
      ).mockImplementationOnce(() => mockEntry2 as any);

      chainOfTitleRepository.addEntry
        .mockResolvedValueOnce(mockEntry1 as any)
        .mockResolvedValueOnce(mockEntry2 as any);

      mockRandomUUID
        .mockReturnValueOnce('entry-123')
        .mockReturnValueOnce('entry-456');

      // Act
      const result1 = await handler.execute(command1);
      const result2 = await handler.execute(command2);

      // Assert
      expect(result1).toBe('entry-123');
      expect(result2).toBe('entry-456');
      expect(result1).not.toBe(result2);
    });

    it('should handle different instrument types', async () => {
      // Arrange
      const instrumentTypes = [
        'DEED',
        'ASSIGNMENT',
        'MORTGAGE',
        'RELEASE',
        'OTHER',
      ];

      for (const instrumentType of instrumentTypes) {
        const command = new AddChainOfTitleEntryCommand(
          'org-123',
          'lease-456',
          instrumentType,
          new Date('2023-01-15'),
          'Grantor',
          'Grantee',
        );

        const mockEntry = {
          getId: jest.fn().mockReturnValue(`entry-${instrumentType}`),
        };
        MockChainOfTitleEntry.mockImplementation(() => mockEntry as any);
        chainOfTitleRepository.addEntry.mockResolvedValue(mockEntry as any);

        const result = await handler.execute(command);
        expect(result).toBe(`entry-${instrumentType}`);
      }
    });

    it('should handle different organization IDs', async () => {
      // Arrange
      const testCases = [
        'org-123',
        '123e4567-e89b-12d3-a456-426614174000',
        'simple-org',
        'org_with_underscores',
        'org-with-dashes',
      ];

      for (const orgId of testCases) {
        const command = new AddChainOfTitleEntryCommand(
          orgId,
          'lease-456',
          'DEED',
          new Date('2023-01-15'),
          'Grantor',
          'Grantee',
        );

        const mockEntry = {
          getId: jest.fn().mockReturnValue('entry-123'),
        };
        MockChainOfTitleEntry.mockImplementation(() => mockEntry as any);
        chainOfTitleRepository.addEntry.mockResolvedValue(mockEntry as any);

        const result = await handler.execute(command);
        expect(result).toBe('entry-123');
        expect(MockChainOfTitleEntry).toHaveBeenCalledWith(
          expect.objectContaining({ organizationId: orgId }),
        );
      }
    });

    it('should handle empty optional fields', async () => {
      // Arrange
      const commandWithEmptyOptionals = new AddChainOfTitleEntryCommand(
        'org-123',
        'lease-456',
        'DEED',
        new Date('2023-01-15'),
        'Grantor',
        'Grantee',
        '', // empty legalDescriptionRef
        {}, // empty recordingInfo
        '', // empty notes
      );

      const mockEntry = {
        getId: jest.fn().mockReturnValue('entry-123'),
      };
      MockChainOfTitleEntry.mockImplementation(() => mockEntry as any);
      chainOfTitleRepository.addEntry.mockResolvedValue(mockEntry as any);

      // Act
      const result = await handler.execute(commandWithEmptyOptionals);

      // Assert
      expect(result).toBe('entry-123');
      expect(MockChainOfTitleEntry).toHaveBeenCalledWith({
        id: 'entry-123',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        instrumentType: 'DEED',
        instrumentDate: new Date('2023-01-15'),
        grantor: 'Grantor',
        grantee: 'Grantee',
        legalDescriptionRef: '',
        recordingInfo: {},
        notes: '',
      });
    });

    it('should handle null optional fields', async () => {
      // Arrange
      const commandWithNullOptionals = new AddChainOfTitleEntryCommand(
        'org-123',
        'lease-456',
        'DEED',
        new Date('2023-01-15'),
        'Grantor',
        'Grantee',
        null as any, // null legalDescriptionRef
        null as any, // null recordingInfo
        null as any, // null notes
      );

      const mockEntry = {
        getId: jest.fn().mockReturnValue('entry-123'),
      };
      MockChainOfTitleEntry.mockImplementation(() => mockEntry as any);
      chainOfTitleRepository.addEntry.mockResolvedValue(mockEntry as any);

      // Act
      const result = await handler.execute(commandWithNullOptionals);

      // Assert
      expect(result).toBe('entry-123');
      expect(MockChainOfTitleEntry).toHaveBeenCalledWith({
        id: 'entry-123',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        instrumentType: 'DEED',
        instrumentDate: new Date('2023-01-15'),
        grantor: 'Grantor',
        grantee: 'Grantee',
        legalDescriptionRef: null,
        recordingInfo: null,
        notes: null,
      });
    });

    it('should handle undefined optional fields', async () => {
      // Arrange
      const commandWithUndefinedOptionals = new AddChainOfTitleEntryCommand(
        'org-123',
        'lease-456',
        'DEED',
        new Date('2023-01-15'),
        'Grantor',
        'Grantee',
        undefined,
        undefined,
        undefined,
      );

      const mockEntry = {
        getId: jest.fn().mockReturnValue('entry-123'),
      };
      MockChainOfTitleEntry.mockImplementation(() => mockEntry as any);
      chainOfTitleRepository.addEntry.mockResolvedValue(mockEntry as any);

      // Act
      const result = await handler.execute(commandWithUndefinedOptionals);

      // Assert
      expect(result).toBe('entry-123');
      expect(MockChainOfTitleEntry).toHaveBeenCalledWith({
        id: 'entry-123',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        instrumentType: 'DEED',
        instrumentDate: new Date('2023-01-15'),
        grantor: 'Grantor',
        grantee: 'Grantee',
        legalDescriptionRef: undefined,
        recordingInfo: undefined,
        notes: undefined,
      });
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      const mockEntry = {
        getId: jest.fn().mockReturnValue('entry-123'),
      };
      MockChainOfTitleEntry.mockImplementation(() => mockEntry as any);
      const nonErrorException = { message: 'Non-error exception', code: 500 };
      chainOfTitleRepository.addEntry.mockRejectedValue(nonErrorException);

      // Act & Assert
      try {
        await handler.execute(validCommand);
        fail('Expected handler to throw an exception');
      } catch (error) {
        expect(error).toBe(nonErrorException);
      }

      expect(chainOfTitleRepository.addEntry).toHaveBeenCalledWith(mockEntry);
    });

    it('should create entry with complete recording info', async () => {
      // Arrange
      const completeRecordingInfo = {
        county: 'Bexar',
        state: 'TX',
        volume: '456',
        page: '789',
        docNumber: 'DOC-2023-001',
        instrumentNumber: 'INST-2023-001',
      };

      const commandWithCompleteRecording = new AddChainOfTitleEntryCommand(
        'org-123',
        'lease-456',
        'DEED',
        new Date('2023-01-15'),
        'Grantor',
        'Grantee',
        'Legal ref',
        completeRecordingInfo,
        'Notes',
      );

      const mockEntry = {
        getId: jest.fn().mockReturnValue('entry-123'),
      };
      MockChainOfTitleEntry.mockImplementation(() => mockEntry as any);
      chainOfTitleRepository.addEntry.mockResolvedValue(mockEntry as any);

      // Act
      const result = await handler.execute(commandWithCompleteRecording);

      // Assert
      expect(result).toBe('entry-123');
      expect(MockChainOfTitleEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          recordingInfo: completeRecordingInfo,
        }),
      );
    });

    it('should create entry with partial recording info', async () => {
      // Arrange
      const partialRecordingInfo = {
        county: 'Harris',
        state: 'TX',
        // missing other fields
      };

      const commandWithPartialRecording = new AddChainOfTitleEntryCommand(
        'org-123',
        'lease-456',
        'DEED',
        new Date('2023-01-15'),
        'Grantor',
        'Grantee',
        undefined,
        partialRecordingInfo,
        undefined,
      );

      const mockEntry = {
        getId: jest.fn().mockReturnValue('entry-123'),
      };
      MockChainOfTitleEntry.mockImplementation(() => mockEntry as any);
      chainOfTitleRepository.addEntry.mockResolvedValue(mockEntry as any);

      // Act
      const result = await handler.execute(commandWithPartialRecording);

      // Assert
      expect(result).toBe('entry-123');
      expect(MockChainOfTitleEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          recordingInfo: partialRecordingInfo,
        }),
      );
    });
  });
});
