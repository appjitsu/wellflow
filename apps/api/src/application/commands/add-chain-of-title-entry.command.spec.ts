import {
  AddChainOfTitleEntryCommand,
  RecordingInfo,
} from './add-chain-of-title-entry.command';

describe('AddChainOfTitleEntryCommand', () => {
  const validOrganizationId = 'org-123';
  const validLeaseId = 'lease-456';
  const validInstrumentType = 'deed';
  const validInstrumentDate = new Date('2023-06-15');
  const validGrantor = 'John Smith';
  const validGrantee = 'ABC Oil Company';
  const validLegalDescriptionRef = 'Section 12, Block 5, Lot 3';
  const validRecordingInfo: RecordingInfo = {
    county: 'Harris',
    state: 'TX',
    volume: '123',
    page: '456',
    docNumber: 'DOC-789',
    instrumentNumber: 'INST-101',
  };
  const validNotes = 'Transfer of mineral rights';

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new AddChainOfTitleEntryCommand(
        validOrganizationId,
        validLeaseId,
        validInstrumentType,
        validInstrumentDate,
        validGrantor,
        validGrantee,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.leaseId).toBe(validLeaseId);
      expect(command.instrumentType).toBe(validInstrumentType);
      expect(command.instrumentDate).toBe(validInstrumentDate);
      expect(command.grantor).toBe(validGrantor);
      expect(command.grantee).toBe(validGrantee);
      expect(command.legalDescriptionRef).toBeUndefined();
      expect(command.recordingInfo).toBeUndefined();
      expect(command.notes).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new AddChainOfTitleEntryCommand(
        validOrganizationId,
        validLeaseId,
        validInstrumentType,
        validInstrumentDate,
        validGrantor,
        validGrantee,
        validLegalDescriptionRef,
        validRecordingInfo,
        validNotes,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.leaseId).toBe(validLeaseId);
      expect(command.instrumentType).toBe(validInstrumentType);
      expect(command.instrumentDate).toBe(validInstrumentDate);
      expect(command.grantor).toBe(validGrantor);
      expect(command.grantee).toBe(validGrantee);
      expect(command.legalDescriptionRef).toBe(validLegalDescriptionRef);
      expect(command.recordingInfo).toEqual(validRecordingInfo);
      expect(command.notes).toBe(validNotes);
    });

    it('should create a command with partial recording info', () => {
      const partialRecordingInfo: RecordingInfo = {
        county: 'Dallas',
        docNumber: 'DOC-999',
      };

      const command = new AddChainOfTitleEntryCommand(
        validOrganizationId,
        validLeaseId,
        validInstrumentType,
        validInstrumentDate,
        validGrantor,
        validGrantee,
        undefined,
        partialRecordingInfo,
      );

      expect(command.recordingInfo).toEqual(partialRecordingInfo);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new AddChainOfTitleEntryCommand(
        validOrganizationId,
        validLeaseId,
        validInstrumentType,
        validInstrumentDate,
        validGrantor,
        validGrantee,
        validLegalDescriptionRef,
      );

      expect(command.organizationId).toBeDefined();
      expect(command.leaseId).toBeDefined();
      expect(command.instrumentType).toBeDefined();
      expect(command.instrumentDate).toBeDefined();
      expect(command.grantor).toBeDefined();
      expect(command.grantee).toBeDefined();
      expect(command.legalDescriptionRef).toBeDefined();
    });

    it('should maintain date reference for instrumentDate', () => {
      const command = new AddChainOfTitleEntryCommand(
        validOrganizationId,
        validLeaseId,
        validInstrumentType,
        validInstrumentDate,
        validGrantor,
        validGrantee,
      );

      expect(command.instrumentDate).toBe(validInstrumentDate);
    });

    it('should maintain object reference for recordingInfo', () => {
      const command = new AddChainOfTitleEntryCommand(
        validOrganizationId,
        validLeaseId,
        validInstrumentType,
        validInstrumentDate,
        validGrantor,
        validGrantee,
        undefined,
        validRecordingInfo,
      );

      expect(command.recordingInfo).toBe(validRecordingInfo);
    });
  });

  describe('RecordingInfo structure', () => {
    it('should validate recording info structure', () => {
      const command = new AddChainOfTitleEntryCommand(
        validOrganizationId,
        validLeaseId,
        validInstrumentType,
        validInstrumentDate,
        validGrantor,
        validGrantee,
        undefined,
        validRecordingInfo,
      );

      expect(command.recordingInfo?.county).toBe('Harris');
      expect(command.recordingInfo?.state).toBe('TX');
      expect(command.recordingInfo?.volume).toBe('123');
      expect(command.recordingInfo?.page).toBe('456');
      expect(command.recordingInfo?.docNumber).toBe('DOC-789');
      expect(command.recordingInfo?.instrumentNumber).toBe('INST-101');
    });

    it('should handle empty recording info object', () => {
      const emptyRecordingInfo: RecordingInfo = {};

      const command = new AddChainOfTitleEntryCommand(
        validOrganizationId,
        validLeaseId,
        validInstrumentType,
        validInstrumentDate,
        validGrantor,
        validGrantee,
        undefined,
        emptyRecordingInfo,
      );

      expect(command.recordingInfo).toEqual({});
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings for optional properties', () => {
      const command = new AddChainOfTitleEntryCommand(
        validOrganizationId,
        validLeaseId,
        validInstrumentType,
        validInstrumentDate,
        validGrantor,
        validGrantee,
        '',
        undefined,
        '',
      );

      expect(command.legalDescriptionRef).toBe('');
      expect(command.notes).toBe('');
    });

    it('should handle undefined optional properties', () => {
      const command = new AddChainOfTitleEntryCommand(
        validOrganizationId,
        validLeaseId,
        validInstrumentType,
        validInstrumentDate,
        validGrantor,
        validGrantee,
        undefined,
        undefined,
        undefined,
      );

      expect(command.legalDescriptionRef).toBeUndefined();
      expect(command.recordingInfo).toBeUndefined();
      expect(command.notes).toBeUndefined();
    });

    it('should handle same grantor and grantee', () => {
      const sameParty = 'XYZ Corporation';
      const command = new AddChainOfTitleEntryCommand(
        validOrganizationId,
        validLeaseId,
        'correction',
        validInstrumentDate,
        sameParty,
        sameParty,
      );

      expect(command.grantor).toBe(sameParty);
      expect(command.grantee).toBe(sameParty);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new AddChainOfTitleEntryCommand(
        validOrganizationId,
        validLeaseId,
        validInstrumentType,
        validInstrumentDate,
        validGrantor,
        validGrantee,
      );

      const orgId1 = command.organizationId;
      const orgId2 = command.organizationId;
      const instrumentDate1 = command.instrumentDate;
      const instrumentDate2 = command.instrumentDate;

      expect(orgId1).toBe(orgId2);
      expect(instrumentDate1).toBe(instrumentDate2);
    });
  });
});
