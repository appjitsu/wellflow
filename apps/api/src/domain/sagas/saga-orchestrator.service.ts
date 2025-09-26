import { Injectable, Logger } from '@nestjs/common';
import { RegulatoryUnitOfWork } from '../../infrastructure/repositories/regulatory-unit-of-work';
import { RegulatoryDomainEventPublisher } from '../shared/regulatory-domain-event-publisher';
import { PermitRenewalSaga, PermitRenewalData } from './permit-renewal.saga';

export interface SagaExecutionResult {
  sagaId: string;
  success: boolean;
  data?: unknown;
  error?: Error;
  canResume: boolean;
}

/**
 * Saga Orchestrator Service
 * Manages the execution of complex regulatory workflows using the Saga pattern
 */
@Injectable()
export class SagaOrchestratorService {
  private readonly logger = new Logger(SagaOrchestratorService.name);
  private readonly activeSagas = new Map<string, PermitRenewalSaga>();

  constructor(
    private readonly unitOfWork: RegulatoryUnitOfWork,
    private readonly eventPublisher: RegulatoryDomainEventPublisher,
  ) {}

  /**
   * Start a permit renewal saga
   */
  async startPermitRenewal(
    data: PermitRenewalData,
  ): Promise<SagaExecutionResult> {
    const sagaId = `permit-renewal-${data.permitId}-${Date.now()}`;

    this.logger.log(`Starting permit renewal saga: ${sagaId}`);

    const saga = new PermitRenewalSaga(
      sagaId,
      data,
      this.unitOfWork,
      this.eventPublisher,
    );

    this.activeSagas.set(sagaId, saga);

    try {
      const result = await saga.execute();

      if (result.success) {
        this.activeSagas.delete(sagaId);
        this.logger.log(
          `Permit renewal saga completed successfully: ${sagaId}`,
        );
      } else {
        this.logger.error(
          `Permit renewal saga failed: ${sagaId}`,
          result.error,
        );
      }

      return {
        sagaId,
        success: result.success,
        data: result.data,
        error: result.error,
        canResume: saga.canResume(),
      };
    } catch (error) {
      this.logger.error(
        `Permit renewal saga execution error: ${sagaId}`,
        error,
      );
      return {
        sagaId,
        success: false,
        error: error instanceof Error ? error : new Error('Unknown saga error'),
        canResume: saga.canResume(),
      };
    }
  }

  /**
   * Resume a failed saga
   */
  async resumeSaga(sagaId: string): Promise<SagaExecutionResult> {
    const saga = this.activeSagas.get(sagaId);

    if (!saga) {
      throw new Error(`Saga not found: ${sagaId}`);
    }

    if (!saga.canResume()) {
      throw new Error(`Saga cannot be resumed: ${sagaId}`);
    }

    this.logger.log(`Resuming saga: ${sagaId}`);

    try {
      const result = await saga.resume();

      if (result.success) {
        this.activeSagas.delete(sagaId);
        this.logger.log(`Saga resumed and completed successfully: ${sagaId}`);
      }

      return {
        sagaId,
        success: result.success,
        data: result.data,
        error: result.error,
        canResume: saga.canResume(),
      };
    } catch (error) {
      this.logger.error(`Saga resume error: ${sagaId}`, error);
      return {
        sagaId,
        success: false,
        error:
          error instanceof Error ? error : new Error('Unknown resume error'),
        canResume: saga.canResume(),
      };
    }
  }

  /**
   * Get saga status
   */
  getSagaStatus(sagaId: string): { status: string; context: unknown } | null {
    const saga = this.activeSagas.get(sagaId);

    if (!saga) {
      return null;
    }

    return {
      status: saga.getStatus(),
      context: saga.getContext(),
    };
  }

  /**
   * Get all active sagas
   */
  getActiveSagas(): Array<{ sagaId: string; status: string; startedAt: Date }> {
    return Array.from(this.activeSagas.entries()).map(([sagaId, saga]) => ({
      sagaId,
      status: saga.getStatus(),
      startedAt: saga.getContext().startedAt,
    }));
  }

  /**
   * Cancel an active saga
   */
  cancelSaga(sagaId: string): boolean {
    const saga = this.activeSagas.get(sagaId);

    if (!saga) {
      return false;
    }

    // Note: In a real implementation, you might want to implement
    // proper saga cancellation with compensation
    this.activeSagas.delete(sagaId);
    this.logger.log(`Saga cancelled: ${sagaId}`);

    return true;
  }

  /**
   * Clean up completed sagas older than specified hours
   */
  cleanupCompletedSagas(olderThanHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [sagaId, saga] of this.activeSagas.entries()) {
      const context = saga.getContext();

      if (
        (context.status === 'completed' || context.status === 'failed') &&
        context.completedAt &&
        context.completedAt < cutoffTime
      ) {
        this.activeSagas.delete(sagaId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} completed sagas`);
    }

    return cleanedCount;
  }
}
