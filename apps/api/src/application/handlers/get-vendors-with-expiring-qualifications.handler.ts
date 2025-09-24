import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { GetVendorsWithExpiringQualificationsQuery } from '../queries/get-vendors-with-expiring-qualifications.query';
import type { VendorRepository } from '../../domain/repositories/vendor.repository.interface';
import {
  InsuranceDto,
  VendorResponseDto,
  CertificationDto,
} from '../dtos/vendor.dto';
import type {
  Vendor,
  VendorCertification,
} from '../../domain/entities/vendor.entity';

/**
 * Get Vendors with Expiring Qualifications Handler
 * Handles the query to retrieve vendors with expiring insurance or certifications
 */
@QueryHandler(GetVendorsWithExpiringQualificationsQuery)
export class GetVendorsWithExpiringQualificationsHandler
  implements IQueryHandler<GetVendorsWithExpiringQualificationsQuery>
{
  private readonly logger = new Logger(
    GetVendorsWithExpiringQualificationsHandler.name,
  );

  constructor(
    @Inject('VendorRepository')
    private readonly vendorRepository: VendorRepository,
  ) {}

  async execute(
    query: GetVendorsWithExpiringQualificationsQuery,
  ): Promise<VendorResponseDto[]> {
    this.logger.log(
      `Getting vendors with expiring qualifications for organization ${query.organizationId} within ${query.daysUntilExpiration} days`,
    );

    try {
      const vendors =
        await this.vendorRepository.findWithExpiringQualifications(
          query.organizationId,
          query.daysUntilExpiration,
        );

      // Convert to DTOs
      const vendorDtos: VendorResponseDto[] = vendors.map((vendor: Vendor) => {
        const performanceMetrics = vendor.getPerformanceMetrics();
        const insurance = vendor.getInsurance();

        // Map insurance to DTO format
        const insuranceDto: InsuranceDto | undefined = insurance
          ? {
              generalLiability: {
                carrier: insurance.generalLiability.carrier,
                policyNumber: insurance.generalLiability.policyNumber,
                coverageAmount: insurance.generalLiability.coverageAmount,
                expirationDate:
                  insurance.generalLiability.expirationDate.toISOString(),
              },
              workersCompensation: insurance.workersCompensation
                ? {
                    carrier: insurance.workersCompensation.carrier,
                    policyNumber: insurance.workersCompensation.policyNumber,
                    coverageAmount:
                      insurance.workersCompensation.coverageAmount,
                    expirationDate:
                      insurance.workersCompensation.expirationDate.toISOString(),
                  }
                : undefined,
              autoLiability: insurance.autoLiability
                ? {
                    carrier: insurance.autoLiability.carrier,
                    policyNumber: insurance.autoLiability.policyNumber,
                    coverageAmount: insurance.autoLiability.coverageAmount,
                    expirationDate:
                      insurance.autoLiability.expirationDate.toISOString(),
                  }
                : undefined,
            }
          : undefined;

        // Map certifications to DTO format
        const certificationDtos: CertificationDto[] = vendor
          .getCertifications()
          .map((cert: VendorCertification) => ({
            name: cert.name,
            issuingBody: cert.issuingBody,
            certificationNumber: cert.certificationNumber,
            issueDate: cert.issueDate.toISOString(),
            expirationDate: cert.expirationDate.toISOString(),
          }));

        return {
          id: vendor.getId(),
          organizationId: vendor.getOrganizationId(),
          vendorCode: vendor.getVendorCode(),
          vendorName: vendor.getVendorName(),
          vendorType: vendor.getVendorType(),
          status: vendor.getStatus(),
          taxId: vendor.getTaxId(),
          billingAddress: vendor.getBillingAddress(),
          paymentTerms: vendor.getPaymentTerms(),
          insurance: insuranceDto,
          certifications: certificationDtos,
          isPrequalified: vendor.isQualified(),
          prequalificationDate: vendor.getPrequalificationDate()?.toISOString(),
          overallRating: performanceMetrics.overallRating,
          safetyRating: performanceMetrics.safetyRating,
          qualityRating: performanceMetrics.qualityRating,
          timelinessRating: performanceMetrics.timelinessRating,
          costEffectivenessRating: performanceMetrics.costEffectivenessRating,
          totalJobsCompleted: performanceMetrics.totalJobsCompleted,
          averageJobValue: performanceMetrics.averageJobValue,
          incidentCount: performanceMetrics.incidentCount,
          lastEvaluationDate:
            performanceMetrics.lastEvaluationDate?.toISOString(),
          isActive: vendor.isActive(),
          createdAt: vendor.getCreatedAt().toISOString(),
          updatedAt: vendor.getUpdatedAt().toISOString(),
        };
      });

      this.logger.log(
        `Found ${vendorDtos.length} vendors with expiring qualifications`,
      );

      return vendorDtos;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to get vendors with expiring qualifications: ${errorMessage}`,
        errorStack,
      );

      throw error;
    }
  }
}
