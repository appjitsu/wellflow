import { AddVendorCertificationCommand } from './add-vendor-certification.command';

describe('AddVendorCertificationCommand', () => {
  const validVendorId = 'vendor-123';
  const validCertificationName = 'OSHA Safety Certification';
  const validIssuingBody = 'OSHA';
  const validCertificationNumber = 'OSH-2024-001';
  const validIssueDate = new Date('2024-01-15');
  const validExpirationDate = new Date('2025-01-15');
  const validDocumentPath = '/documents/certifications/osha-2024-001.pdf';
  const validAddedBy = 'user-456';

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new AddVendorCertificationCommand(
        validVendorId,
        validCertificationName,
        validIssuingBody,
        validCertificationNumber,
        validIssueDate,
        validExpirationDate,
      );

      expect(command.vendorId).toBe(validVendorId);
      expect(command.certificationName).toBe(validCertificationName);
      expect(command.issuingBody).toBe(validIssuingBody);
      expect(command.certificationNumber).toBe(validCertificationNumber);
      expect(command.issueDate).toBe(validIssueDate);
      expect(command.expirationDate).toBe(validExpirationDate);
      expect(command.documentPath).toBeUndefined();
      expect(command.addedBy).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new AddVendorCertificationCommand(
        validVendorId,
        validCertificationName,
        validIssuingBody,
        validCertificationNumber,
        validIssueDate,
        validExpirationDate,
        validDocumentPath,
        validAddedBy,
      );

      expect(command.vendorId).toBe(validVendorId);
      expect(command.certificationName).toBe(validCertificationName);
      expect(command.issuingBody).toBe(validIssuingBody);
      expect(command.certificationNumber).toBe(validCertificationNumber);
      expect(command.issueDate).toBe(validIssueDate);
      expect(command.expirationDate).toBe(validExpirationDate);
      expect(command.documentPath).toBe(validDocumentPath);
      expect(command.addedBy).toBe(validAddedBy);
    });

    it('should create a command with documentPath only', () => {
      const command = new AddVendorCertificationCommand(
        validVendorId,
        validCertificationName,
        validIssuingBody,
        validCertificationNumber,
        validIssueDate,
        validExpirationDate,
        validDocumentPath,
      );

      expect(command.documentPath).toBe(validDocumentPath);
      expect(command.addedBy).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new AddVendorCertificationCommand(
        validVendorId,
        validCertificationName,
        validIssuingBody,
        validCertificationNumber,
        validIssueDate,
        validExpirationDate,
        validDocumentPath,
      );

      expect(command.vendorId).toBeDefined();
      expect(command.certificationName).toBeDefined();
      expect(command.issuingBody).toBeDefined();
      expect(command.certificationNumber).toBeDefined();
      expect(command.issueDate).toBeDefined();
      expect(command.expirationDate).toBeDefined();
      expect(command.documentPath).toBeDefined();
    });

    it('should maintain date object references', () => {
      const command = new AddVendorCertificationCommand(
        validVendorId,
        validCertificationName,
        validIssuingBody,
        validCertificationNumber,
        validIssueDate,
        validExpirationDate,
      );

      expect(command.issueDate).toBe(validIssueDate);
      expect(command.expirationDate).toBe(validExpirationDate);
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings for optional properties', () => {
      const command = new AddVendorCertificationCommand(
        validVendorId,
        validCertificationName,
        validIssuingBody,
        validCertificationNumber,
        validIssueDate,
        validExpirationDate,
        '',
        '',
      );

      expect(command.documentPath).toBe('');
      expect(command.addedBy).toBe('');
    });

    it('should handle undefined optional properties', () => {
      const command = new AddVendorCertificationCommand(
        validVendorId,
        validCertificationName,
        validIssuingBody,
        validCertificationNumber,
        validIssueDate,
        validExpirationDate,
        undefined,
        undefined,
      );

      expect(command.documentPath).toBeUndefined();
      expect(command.addedBy).toBeUndefined();
    });

    it('should handle same issue and expiration dates', () => {
      const sameDate = new Date('2024-06-01');
      const command = new AddVendorCertificationCommand(
        validVendorId,
        validCertificationName,
        validIssuingBody,
        validCertificationNumber,
        sameDate,
        sameDate,
      );

      expect(command.issueDate).toBe(sameDate);
      expect(command.expirationDate).toBe(sameDate);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new AddVendorCertificationCommand(
        validVendorId,
        validCertificationName,
        validIssuingBody,
        validCertificationNumber,
        validIssueDate,
        validExpirationDate,
      );

      const vendorId1 = command.vendorId;
      const vendorId2 = command.vendorId;
      const issueDate1 = command.issueDate;
      const issueDate2 = command.issueDate;

      expect(vendorId1).toBe(vendorId2);
      expect(issueDate1).toBe(issueDate2);
    });
  });
});
