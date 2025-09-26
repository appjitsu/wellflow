/**
 * Saga step result
 */
export interface SagaStepResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error;
  compensationData?: unknown;
}

/**
 * Saga step definition
 */
export interface SagaStep<TData = unknown, TCompensation = unknown> {
  name: string;
  execute: (data: TData) => Promise<SagaStepResult>;
  compensate?: (compensationData: TCompensation) => Promise<void>;
}

/**
 * Saga execution context
 */
export interface SagaContext<TData = unknown> {
  sagaId: string;
  data: TData;
  steps: SagaStep[];
  currentStep: number;
  completedSteps: SagaStepResult[];
  status: 'running' | 'completed' | 'compensating' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  error?: Error;
}

/**
 * Base Saga class implementing the Saga pattern
 * Provides orchestration for complex business transactions with compensation
 */
export abstract class Saga<TData = unknown> {
  protected context: SagaContext<TData>;

  constructor(sagaId: string, initialData: TData) {
    this.context = {
      sagaId,
      data: initialData,
      steps: this.defineSteps(),
      currentStep: 0,
      completedSteps: [],
      status: 'running',
      startedAt: new Date(),
    };
  }

  /**
   * Define the steps for this saga
   */
  protected abstract defineSteps(): SagaStep[];

  /**
   * Execute the saga
   */
  async execute(): Promise<SagaStepResult> {
    try {
      /* eslint-disable security/detect-object-injection */
      for (
        let i = this.context.currentStep;
        i < this.context.steps.length;
        i++
      ) {
        const step = this.context.steps[i];
        if (!step) {
          this.context.status = 'failed';
          this.context.error = new Error(`Step at index ${i} is undefined`);
          return { success: false, error: this.context.error };
        }

        this.context.currentStep = i;

        const result = await step.execute(this.context.data);

        if (!result.success) {
          this.context.status = 'compensating';
          this.context.error =
            result.error || new Error(`Step ${step.name} failed`);

          // Execute compensation for completed steps in reverse order
          await this.compensate();

          this.context.status = 'failed';
          return result;
        }

        this.context.completedSteps.push(result);
      }
      /* eslint-enable security/detect-object-injection */

      this.context.status = 'completed';
      this.context.completedAt = new Date();

      return {
        success: true,
        data: this.context.data,
      };
    } catch (error) {
      this.context.status = 'failed';
      this.context.error =
        error instanceof Error ? error : new Error('Unknown saga error');

      await this.compensate();

      return {
        success: false,
        error: this.context.error,
      };
    }
  }

  /**
   * Compensate for failed steps
   */
  private async compensate(): Promise<void> {
    // Execute compensation in reverse order
    /* eslint-disable security/detect-object-injection */
    for (let i = this.context.completedSteps.length - 1; i >= 0; i--) {
      const completedStep = this.context.completedSteps[i];
      const stepDefinition = this.context.steps[i];

      if (
        stepDefinition &&
        completedStep &&
        stepDefinition.compensate &&
        completedStep.compensationData
      ) {
        try {
          await stepDefinition.compensate(completedStep.compensationData);
        } catch (compensationError) {
          // Log compensation failure but don't stop the process
          console.error(
            `Compensation failed for step ${stepDefinition.name}:`,
            compensationError,
          );
        }
      }
    }
    /* eslint-enable security/detect-object-injection */
  }

  /**
   * Get saga status
   */
  getStatus() {
    return this.context.status;
  }

  /**
   * Get saga context
   */
  getContext(): Readonly<SagaContext<TData>> {
    return { ...this.context };
  }

  /**
   * Check if saga can be resumed
   */
  canResume(): boolean {
    return (
      this.context.status === 'failed' &&
      this.context.currentStep < this.context.steps.length
    );
  }

  /**
   * Resume saga execution from failed step
   */
  async resume(): Promise<SagaStepResult> {
    if (!this.canResume()) {
      throw new Error('Saga cannot be resumed');
    }

    this.context.status = 'running';
    return this.execute();
  }
}
