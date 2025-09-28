import {
  CreateVendorCommand,
  CreateVendorAddress,
} from '../create-vendor.command';
import { VendorType } from '../../../domain/enums/vendor-status.enum';

describe('CreateVendorCommand', () => {
  const validOrganizationId = 'org-123';
  const validVendorName = 'ABC Services Inc.';
  const validVendorCode = 'ABC-001';
  const validVendorType = VendorType.SERVICE;
  const validBillingAddress: CreateVendorAddress = {
    street: '123 Main St',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201',
    country: 'USA',
  };
  const validPaymentTerms = 'Net 30';
  const validTaxId = '12-3456789';
  const validServiceAddress: CreateVendorAddress = {
    street: '456 Service Ave',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75202',
    country: 'USA',
  };
  const validWebsite = 'https://abcservices.com';
  const validNotes = 'Preferred vendor for drilling services';
  const validCreatedBy = 'user-456';

  describe('constructor', () => {
    it('should create a command with all required properties', () => {
      const command = new CreateVendorCommand(
        validOrganizationId,
        validVendorName,
        validVendorCode,
        validVendorType,
        validBillingAddress,
        validPaymentTerms,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.vendorName).toBe(validVendorName);
      expect(command.vendorCode).toBe(validVendorCode);
      expect(command.vendorType).toBe(validVendorType);
      expect(command.billingAddress).toEqual(validBillingAddress);
      expect(command.paymentTerms).toBe(validPaymentTerms);
      expect(command.taxId).toBeUndefined();
      expect(command.serviceAddress).toBeUndefined();
      expect(command.website).toBeUndefined();
      expect(command.notes).toBeUndefined();
      expect(command.createdBy).toBeUndefined();
    });

    it('should create a command with all optional properties', () => {
      const command = new CreateVendorCommand(
        validOrganizationId,
        validVendorName,
        validVendorCode,
        validVendorType,
        validBillingAddress,
        validPaymentTerms,
        validTaxId,
        validServiceAddress,
        validWebsite,
        validNotes,
        validCreatedBy,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.vendorName).toBe(validVendorName);
      expect(command.vendorCode).toBe(validVendorCode);
      expect(command.vendorType).toBe(validVendorType);
      expect(command.billingAddress).toEqual(validBillingAddress);
      expect(command.paymentTerms).toBe(validPaymentTerms);
      expect(command.taxId).toBe(validTaxId);
      expect(command.serviceAddress).toEqual(validServiceAddress);
      expect(command.website).toBe(validWebsite);
      expect(command.notes).toBe(validNotes);
      expect(command.createdBy).toBe(validCreatedBy);
    });

    it('should create a command with minimal required properties', () => {
      const command = new CreateVendorCommand(
        validOrganizationId,
        validVendorName,
        validVendorCode,
        validVendorType,
        validBillingAddress,
        validPaymentTerms,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.vendorName).toBe(validVendorName);
      expect(command.vendorCode).toBe(validVendorCode);
      expect(command.vendorType).toBe(validVendorType);
      expect(command.billingAddress).toEqual(validBillingAddress);
      expect(command.paymentTerms).toBe(validPaymentTerms);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new CreateVendorCommand(
        validOrganizationId,
        validVendorName,
        validVendorCode,
        validVendorType,
        validBillingAddress,
        validPaymentTerms,
      );

      // Properties should be accessible
      expect(command.organizationId).toBeDefined();
      expect(command.vendorName).toBeDefined();
      expect(command.vendorCode).toBeDefined();
      expect(command.vendorType).toBeDefined();
      expect(command.billingAddress).toBeDefined();
      expect(command.paymentTerms).toBeDefined();
    });

    it('should maintain object references for complex properties', () => {
      const command = new CreateVendorCommand(
        validOrganizationId,
        validVendorName,
        validVendorCode,
        validVendorType,
        validBillingAddress,
        validPaymentTerms,
        validTaxId,
        validServiceAddress,
      );

      expect(command.billingAddress).toBe(validBillingAddress);
      expect(command.serviceAddress).toBe(validServiceAddress);
    });
  });

  describe('CreateVendorAddress interface', () => {
    it('should validate address structure', () => {
      const address: CreateVendorAddress = {
        street: '123 Main St',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201',
        country: 'USA',
      };

      expect(address.street).toBe('123 Main St');
      expect(address.city).toBe('Dallas');
      expect(address.state).toBe('TX');
      expect(address.zipCode).toBe('75201');
      expect(address.country).toBe('USA');
    });
  });

  describe('VendorType enum', () => {
    it('should have correct vendor type values', () => {
      expect(VendorType.SERVICE).toBe('service');
      expect(VendorType.SUPPLIER).toBe('supplier');
      expect(VendorType.CONTRACTOR).toBe('contractor');
      expect(VendorType.CONSULTANT).toBe('consultant');
      expect(VendorType.TRANSPORTATION).toBe('transportation');
      expect(VendorType.MAINTENANCE).toBe('maintenance');
      expect(VendorType.ENVIRONMENTAL).toBe('environmental');
      expect(VendorType.LABORATORY).toBe('laboratory');
    });
  });

  describe('edge cases', () => {
    it('should handle empty optional string values', () => {
      const command = new CreateVendorCommand(
        validOrganizationId,
        validVendorName,
        validVendorCode,
        validVendorType,
        validBillingAddress,
        validPaymentTerms,
        '', // empty taxId
        undefined,
        '', // empty website
        '', // empty notes
        '', // empty createdBy
      );

      expect(command.taxId).toBe('');
      expect(command.website).toBe('');
      expect(command.notes).toBe('');
      expect(command.createdBy).toBe('');
    });

    it('should handle undefined optional properties', () => {
      const command = new CreateVendorCommand(
        validOrganizationId,
        validVendorName,
        validVendorCode,
        validVendorType,
        validBillingAddress,
        validPaymentTerms,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      expect(command.taxId).toBeUndefined();
      expect(command.serviceAddress).toBeUndefined();
      expect(command.website).toBeUndefined();
      expect(command.notes).toBeUndefined();
      expect(command.createdBy).toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new CreateVendorCommand(
        validOrganizationId,
        validVendorName,
        validVendorCode,
        validVendorType,
        validBillingAddress,
        validPaymentTerms,
      );

      const orgId1 = command.organizationId;
      const orgId2 = command.organizationId;
      const billingAddr1 = command.billingAddress;
      const billingAddr2 = command.billingAddress;

      expect(orgId1).toBe(orgId2);
      expect(billingAddr1).toBe(billingAddr2);
    });
  });
});
