import { Injectable } from '@nestjs/common';
import { Saga, SagaStep, SagaStepResult } from './saga';
import { RegulatoryUnitOfWork } from '../../infrastructure/repositories/regulatory-unit-of-work';
import { RegulatoryDomainEventPublisher } from '../shared/regulatory-domain-event-publisher';
import { PermitRenewalRequestedEvent } from '../events/permit-renewal-requested.event';
import { PermitRenewalApprovedEvent } from '../events/permit-renewal-approved.event';

export interface PermitRenewalData {
  permitId: string;
  organizationId: string;
  requestedByUserId: string;
  newExpirationDate: Date;
  renewalReason: string;
  updatedConditions?: Record<string, unknown>;
  renewalFee?: number;
  supportingDocuments?: string[];
}

export interface PermitRenewalCompensationData {
  permitId: string;
  organizationId: string;
  stepName: string;
  originalState?: Record<string, unknown>;
  compensationReason: string;
  originalExpirationDate?: Date;
  originalConditions?: Record<string, unknown>;
  renewalFee?: number;
}

/**
 * Permit Renewal Saga
 * Orchestrates the complex permit renewal workflow with compensation logic
 *
 * Steps:
 * 1. Validate renewal request
 * 2. Submit renewal application
 * 3. Process payment (if required)
 * 4. Regulatory agency review
 * 5. Final approval and permit update
 */
@Injectable()
export class PermitRenewalSaga extends Saga<PermitRenewalData> {
  constructor(
    sagaId: string,
    data: PermitRenewalData,
    private readonly unitOfWork: RegulatoryUnitOfWork,
    private readonly eventPublisher: RegulatoryDomainEventPublisher,
  ) {
    super(sagaId, data);
  }

  protected defineSteps(): SagaStep[] {
    return [
      {
        name: 'Validate Renewal Request',
        execute: (data: unknown) =>
          this.validateRenewalRequest(data as PermitRenewalData),
      },
      {
        name: 'Submit Renewal Application',
        execute: async (data: unknown) => {
          const renewalData = data as PermitRenewalData;
          return await this.submitRenewalApplication(renewalData);
        },
        compensate: (compensationData: unknown) =>
          this.cancelRenewalApplication(
            compensationData as Record<string, unknown>,
          ),
      },
      {
        name: 'Process Payment',
        execute: (data: unknown) => {
          const renewalData = data as PermitRenewalData;
          return Promise.resolve(this.processPayment(renewalData));
        },
        compensate: async (compensationData: unknown) => {
          const compData = compensationData as Record<string, unknown>;
          return await this.refundPayment(compData);
        },
      },
      {
        name: 'Regulatory Agency Review',
        execute: (data: unknown) => {
          const renewalData = data as PermitRenewalData;
          return Promise.resolve(this.regulatoryAgencyReview(renewalData));
        },
        compensate: async (compensationData: unknown) => {
          const compData = compensationData as Record<string, unknown>;
          return await this.cancelRegulatoryReview(compData);
        },
      },
      {
        name: 'Final Approval',
        execute: (data: unknown) =>
          this.finalApproval(data as PermitRenewalData),
        compensate: (compensationData: unknown) =>
          this.revertPermitChanges(
            compensationData as PermitRenewalCompensationData,
          ),
      },
    ];
  }

  /**
   * Step 1: Validate renewal request
   */
  private async validateRenewalRequest(
    data: PermitRenewalData,
  ): Promise<SagaStepResult> {
    try {
      // Get the permit
      const permit = await this.unitOfWork
        .getPermitRepository()
        .findById(data.permitId);
      if (!permit) {
        return {
          success: false,
          error: new Error('Permit not found'),
        };
      }

      // Validate permit can be renewed
      if (!permit.canBeRenewed()) {
        return {
          success: false,
          error: new Error('Permit cannot be renewed in its current state'),
        };
      }

      // Validate new expiration date is in the future
      if (data.newExpirationDate <= new Date()) {
        return {
          success: false,
          error: new Error('New expiration date must be in the future'),
        };
      }

      // Validate renewal window (typically 30-90 days before expiration)
      if (!permit.expirationDate) {
        return {
          success: false,
          error: new Error('Permit has no expiration date - cannot renew'),
        };
      }
      const renewalWindowStart = new Date(permit.expirationDate);
      renewalWindowStart.setDate(renewalWindowStart.getDate() - 90); // 90 days before expiration

      if (new Date() < renewalWindowStart) {
        return {
          success: false,
          error: new Error('Permit renewal is not yet available'),
        };
      }

      return {
        success: true,
        data: {
          permit,
          originalExpirationDate: permit.expirationDate,
          originalConditions: permit.permitConditions,
        },
        compensationData: {
          permitId: data.permitId,
          originalExpirationDate: permit.expirationDate,
          originalConditions: permit.permitConditions,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Validation failed'),
      };
    }
  }

  /**
   * Step 2: Submit renewal application
   */
  private async submitRenewalApplication(
    data: PermitRenewalData,
  ): Promise<SagaStepResult> {
    try {
      this.unitOfWork.begin();

      // Create renewal request record

      // Update permit status to renewal pending
      const permit = await this.unitOfWork
        .getPermitRepository()
        .findById(data.permitId);
      if (!permit) {
        throw new Error('Permit not found during application submission');
      }

      // Publish renewal requested event
      const renewalRequestedEvent = new PermitRenewalRequestedEvent(
        data.permitId,
        data.requestedByUserId,
        data.newExpirationDate,
        data.renewalReason,
      );

      await this.eventPublisher.publish(
        renewalRequestedEvent,
        data.organizationId,
      );

      await this.unitOfWork.commit();

      return {
        success: true,
        compensationData: {
          permitId: data.permitId,
          renewalRequested: true,
        },
      };
    } catch (error) {
      this.unitOfWork.rollback();
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error('Application submission failed'),
      };
    }
  }

  /**
   * Step 3: Process payment (if required)
   */
  private processPayment(data: PermitRenewalData): SagaStepResult {
    try {
      if (!data.renewalFee || data.renewalFee <= 0) {
        // No payment required
        return {
          success: true,
          compensationData: {
            paymentRequired: false,
          },
        };
      }

      // Integrate with payment service
      // const paymentResult = await this.paymentService.processPayment({
      //   amount: data.renewalFee,
      //   description: `Permit renewal fee for ${data.permitId}`,
      //   organizationId: data.organizationId,
      // });

      // if (!paymentResult.success) {
      //   throw new Error('Payment processing failed');
      // }

      return {
        success: true,
        data: {
          paymentProcessed: true,
          // paymentId: paymentResult.paymentId,
        },
        compensationData: {
          paymentRequired: true,
          // paymentId: paymentResult.paymentId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error('Payment processing failed'),
      };
    }
  }

  /**
   * Step 4: Regulatory agency review
   */
  private regulatoryAgencyReview(_data: PermitRenewalData): SagaStepResult {
    try {
      // Submit to regulatory agency API
      // const agencyResult = await this.regulatoryApi.submitPermitRenewal({
      //   permitId: data.permitId,
      //   newExpirationDate: data.newExpirationDate,
      //   renewalReason: data.renewalReason,
      //   supportingDocuments: data.supportingDocuments,
      // });

      // Simulate agency review (in real implementation, this would be async)
      const agencyApproved = true; // This would come from agency response

      if (!agencyApproved) {
        return {
          success: false,
          error: new Error('Regulatory agency rejected renewal'),
        };
      }

      return {
        success: true,
        data: {
          agencyApproved: true,
          // agencyReferenceNumber: agencyResult.referenceNumber,
        },
        compensationData: {
          agencySubmitted: true,
          // agencyReferenceNumber: agencyResult.referenceNumber,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error : new Error('Agency review failed'),
      };
    }
  }

  /**
   * Step 5: Final approval and permit update
   */
  private async finalApproval(
    data: PermitRenewalData,
  ): Promise<SagaStepResult> {
    try {
      this.unitOfWork.begin();

      const permit = await this.unitOfWork
        .getPermitRepository()
        .findById(data.permitId);
      if (!permit) {
        throw new Error('Permit not found during final approval');
      }

      // Update permit with new expiration date and conditions
      permit.renew(data.requestedByUserId, data.newExpirationDate);

      if (data.updatedConditions) {
        permit.updateConditions(data.updatedConditions, data.requestedByUserId);
      }

      this.unitOfWork.updatePermit(permit);

      // Publish approval event
      const approvalEvent = new PermitRenewalApprovedEvent(
        data.permitId,
        data.requestedByUserId,
        data.newExpirationDate,
      );

      await this.eventPublisher.publish(approvalEvent, data.organizationId);

      await this.unitOfWork.commit();

      return {
        success: true,
        data: {
          permitUpdated: true,
          newExpirationDate: data.newExpirationDate,
        },
      };
    } catch (error) {
      this.unitOfWork.rollback();
      return {
        success: false,
        error:
          error instanceof Error ? error : new Error('Final approval failed'),
      };
    }
  }

  // Compensation methods

  private async cancelRenewalApplication(
    compensationData: Record<string, unknown>,
  ): Promise<void> {
    if (compensationData.renewalRequested) {
      // Cancel renewal application in external systems
      // await this.regulatoryApi.cancelRenewalApplication(compensationData.permitId);
    }
    return Promise.resolve();
  }

  private async refundPayment(
    compensationData: Record<string, unknown>,
  ): Promise<void> {
    if (compensationData.paymentRequired && compensationData.paymentId) {
      // Process refund
      // await this.paymentService.refundPayment(compensationData.paymentId);
    }
    return Promise.resolve();
  }

  private async cancelRegulatoryReview(
    compensationData: Record<string, unknown>,
  ): Promise<void> {
    if (
      compensationData.agencySubmitted &&
      compensationData.agencyReferenceNumber
    ) {
      // Cancel agency review
      // await this.regulatoryApi.cancelRenewalReview(compensationData.agencyReferenceNumber);
    }
    return Promise.resolve();
  }

  private async revertPermitChanges(
    compensationData: PermitRenewalCompensationData,
  ): Promise<void> {
    try {
      this.unitOfWork.begin();

      const permit = await this.unitOfWork
        .getPermitRepository()
        .findById(compensationData.permitId);
      if (permit) {
        // Revert permit to original state
        if (compensationData.originalExpirationDate) {
          permit.revertExpirationDate(compensationData.originalExpirationDate);
        }

        if (compensationData.originalConditions) {
          permit.updateConditions(
            compensationData.originalConditions,
            'system',
          );
        }

        this.unitOfWork.updatePermit(permit);
      }

      await this.unitOfWork.commit();
    } catch (error) {
      this.unitOfWork.rollback();
      throw error;
    }
  }
}
