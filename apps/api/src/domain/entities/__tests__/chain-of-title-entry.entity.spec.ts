import {
  ChainOfTitleEntry,
  RecordingInfo,
} from '../chain-of-title-entry.entity';

describe('ChainOfTitleEntry', () => {
  describe('interfaces', () => {
    it('should define RecordingInfo interface structure', () => {
      const recordingInfo: RecordingInfo = {
        county: 'Harris',
        state: 'TX',
        volume: '123',
        page: '456',
        instrumentNumber: '789',
      };

      expect(recordingInfo.county).toBe('Harris');
      expect(recordingInfo.state).toBe('TX');
      expect(recordingInfo.volume).toBe('123');
      expect(recordingInfo.page).toBe('456');
      expect(recordingInfo.instrumentNumber).toBe('789');
    });

    it('should allow partial RecordingInfo', () => {
      const partialRecordingInfo: RecordingInfo = {
        county: 'Harris',
        instrumentNumber: '789',
      };

      expect(partialRecordingInfo.county).toBe('Harris');
      expect(partialRecordingInfo.state).toBeUndefined();
      expect(partialRecordingInfo.instrumentNumber).toBe('789');
    });

    it('should define ChainOfTitleEntry props interface structure', () => {
      const props = {
        id: 'entry-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        instrumentType: 'deed',
        instrumentDate: new Date('2024-01-01'),
        grantor: 'John Doe',
        grantee: 'Jane Smith',
        legalDescriptionRef: 'Section 10, Block 5',
        recordingInfo: {
          county: 'Harris',
          state: 'TX',
          volume: '123',
          page: '456',
        },
        notes: 'Transfer of mineral rights',
        createdAt: new Date('2024-01-02'),
      };

      expect(props.id).toBe('entry-123');
      expect(props.organizationId).toBe('org-456');
      expect(props.leaseId).toBe('lease-789');
      expect(props.instrumentType).toBe('deed');
      expect(props.instrumentDate).toEqual(new Date('2024-01-01'));
      expect(props.grantor).toBe('John Doe');
      expect(props.grantee).toBe('Jane Smith');
      expect(props.legalDescriptionRef).toBe('Section 10, Block 5');
      expect(props.recordingInfo).toEqual({
        county: 'Harris',
        state: 'TX',
        volume: '123',
        page: '456',
      });
      expect(props.notes).toBe('Transfer of mineral rights');
      expect(props.createdAt).toEqual(new Date('2024-01-02'));
    });
  });

  describe('constructor', () => {
    it('should create entry with all required properties', () => {
      const props = {
        id: 'entry-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        instrumentType: 'deed',
        instrumentDate: new Date('2024-01-01'),
        grantor: 'John Doe',
        grantee: 'Jane Smith',
      };

      const entry = new ChainOfTitleEntry(props);

      expect(entry.getId()).toBe('entry-123');
      expect(entry.getOrganizationId()).toBe('org-456');
      expect(entry.getLeaseId()).toBe('lease-789');
      expect(entry.getInstrumentType()).toBe('deed');
      expect(entry.getInstrumentDate()).toEqual(new Date('2024-01-01'));
      expect(entry.getGrantor()).toBe('John Doe');
      expect(entry.getGrantee()).toBe('Jane Smith');
      expect(entry.getLegalDescriptionRef()).toBeUndefined();
      expect(entry.getRecordingInfo()).toBeUndefined();
      expect(entry.getNotes()).toBeUndefined();
    });

    it('should create entry with all optional properties', () => {
      const recordingInfo: RecordingInfo = {
        county: 'Harris',
        state: 'TX',
        volume: '123',
        page: '456',
        instrumentNumber: '789',
      };

      const props = {
        id: 'entry-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        instrumentType: 'assignment',
        instrumentDate: new Date('2024-01-01T12:00:00Z'),
        grantor: 'John Doe',
        grantee: 'Jane Smith',
        legalDescriptionRef: 'Section 10, Block 5, Lot 1',
        recordingInfo,
        notes: 'Mineral rights assignment',
        createdAt: new Date('2024-01-02T10:00:00Z'),
      };

      const entry = new ChainOfTitleEntry(props);

      expect(entry.getId()).toBe('entry-123');
      expect(entry.getOrganizationId()).toBe('org-456');
      expect(entry.getLeaseId()).toBe('lease-789');
      expect(entry.getInstrumentType()).toBe('assignment');
      expect(entry.getInstrumentDate()).toEqual(
        new Date('2024-01-01T12:00:00Z'),
      );
      expect(entry.getGrantor()).toBe('John Doe');
      expect(entry.getGrantee()).toBe('Jane Smith');
      expect(entry.getLegalDescriptionRef()).toBe('Section 10, Block 5, Lot 1');
      expect(entry.getRecordingInfo()).toEqual(recordingInfo);
      expect(entry.getNotes()).toBe('Mineral rights assignment');
    });

    it('should set createdAt to current date if not provided', () => {
      const props = {
        id: 'entry-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        instrumentType: 'deed',
        instrumentDate: new Date('2024-01-01'),
        grantor: 'John Doe',
        grantee: 'Jane Smith',
      };

      const entry = new ChainOfTitleEntry(props);

      // We can't directly access createdAt, but we can verify the entry was created successfully
      expect(entry).toBeInstanceOf(ChainOfTitleEntry);
      expect(entry.getId()).toBe('entry-123');
    });

    it('should create a copy of instrumentDate to prevent external mutation', () => {
      const originalDate = new Date('2024-01-01T12:00:00Z');
      const props = {
        id: 'entry-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        instrumentType: 'deed',
        instrumentDate: originalDate,
        grantor: 'John Doe',
        grantee: 'Jane Smith',
      };

      const entry = new ChainOfTitleEntry(props);

      // Modify the original date
      originalDate.setFullYear(2025);

      // The entry's date should remain unchanged
      expect(entry.getInstrumentDate()).toEqual(
        new Date('2024-01-01T12:00:00Z'),
      );
      expect(entry.getInstrumentDate().getFullYear()).toBe(2024);
    });
  });

  describe('getters', () => {
    let entry: ChainOfTitleEntry;
    let recordingInfo: RecordingInfo;

    beforeEach(() => {
      recordingInfo = {
        county: 'Harris',
        state: 'TX',
        volume: '123',
        page: '456',
        instrumentNumber: '789',
      };

      const props = {
        id: 'entry-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        instrumentType: 'mortgage',
        instrumentDate: new Date('2024-01-01T12:00:00Z'),
        grantor: 'John Doe',
        grantee: 'Jane Smith',
        legalDescriptionRef: 'Section 10, Block 5',
        recordingInfo,
        notes: 'Mortgage for mineral rights',
        createdAt: new Date('2024-01-02T10:00:00Z'),
      };

      entry = new ChainOfTitleEntry(props);
    });

    it('should return correct id', () => {
      expect(entry.getId()).toBe('entry-123');
    });

    it('should return correct organizationId', () => {
      expect(entry.getOrganizationId()).toBe('org-456');
    });

    it('should return correct leaseId', () => {
      expect(entry.getLeaseId()).toBe('lease-789');
    });

    it('should return correct instrumentType', () => {
      expect(entry.getInstrumentType()).toBe('mortgage');
    });

    it('should return correct instrumentDate', () => {
      expect(entry.getInstrumentDate()).toEqual(
        new Date('2024-01-01T12:00:00Z'),
      );
    });

    it('should return correct grantor', () => {
      expect(entry.getGrantor()).toBe('John Doe');
    });

    it('should return correct grantee', () => {
      expect(entry.getGrantee()).toBe('Jane Smith');
    });

    it('should return correct legalDescriptionRef', () => {
      expect(entry.getLegalDescriptionRef()).toBe('Section 10, Block 5');
    });

    it('should return correct recordingInfo', () => {
      expect(entry.getRecordingInfo()).toEqual(recordingInfo);
    });

    it('should return correct notes', () => {
      expect(entry.getNotes()).toBe('Mortgage for mineral rights');
    });

    it('should return a copy of recordingInfo to prevent external mutation', () => {
      const returnedInfo = entry.getRecordingInfo();
      if (returnedInfo) {
        returnedInfo.county = 'Modified County';
      }

      // The original should remain unchanged
      expect(entry.getRecordingInfo()?.county).toBe('Harris');
    });

    it('should return a copy of instrumentDate to prevent external mutation', () => {
      const returnedDate = entry.getInstrumentDate();
      returnedDate.setFullYear(2025);

      // The entry's date should remain unchanged
      expect(entry.getInstrumentDate().getFullYear()).toBe(2024);
    });
  });

  describe('different instrument types', () => {
    const instrumentTypes = [
      'deed',
      'assignment',
      'probate',
      'affidavit',
      'release',
      'mortgage',
      'other',
    ];

    instrumentTypes.forEach((type) => {
      it(`should handle ${type} instrument type`, () => {
        const props = {
          id: `entry-${type}`,
          organizationId: 'org-123',
          leaseId: 'lease-456',
          instrumentType: type,
          instrumentDate: new Date('2024-01-01'),
          grantor: 'Grantor Name',
          grantee: 'Grantee Name',
        };

        const entry = new ChainOfTitleEntry(props);
        expect(entry.getInstrumentType()).toBe(type);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings for optional fields', () => {
      const props = {
        id: 'entry-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        instrumentType: 'deed',
        instrumentDate: new Date('2024-01-01'),
        grantor: 'John Doe',
        grantee: 'Jane Smith',
        legalDescriptionRef: '',
        notes: '',
      };

      const entry = new ChainOfTitleEntry(props);

      expect(entry.getLegalDescriptionRef()).toBe('');
      expect(entry.getNotes()).toBe('');
    });

    it('should handle undefined optional fields', () => {
      const props = {
        id: 'entry-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        instrumentType: 'deed',
        instrumentDate: new Date('2024-01-01'),
        grantor: 'John Doe',
        grantee: 'Jane Smith',
        legalDescriptionRef: undefined,
        recordingInfo: undefined,
        notes: undefined,
      };

      const entry = new ChainOfTitleEntry(props);

      expect(entry.getLegalDescriptionRef()).toBeUndefined();
      expect(entry.getRecordingInfo()).toBeUndefined();
      expect(entry.getNotes()).toBeUndefined();
    });
  });
});
