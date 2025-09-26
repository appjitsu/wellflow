/**
 * Base domain error class
 */
export abstract class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Well-related domain errors
 */
export class WellNotFoundError extends DomainError {
  constructor(wellId: string) {
    const message = `Well with ID '${wellId}' was not found`;
    super(message, 'WELL_NOT_FOUND', 404, true, { wellId });
  }
}

export class WellAlreadyExistsError extends DomainError {
  constructor(apiNumber: string) {
    const message = `Well with API number '${apiNumber}' already exists`;
    super(message, 'WELL_ALREADY_EXISTS', 409, true, { apiNumber });
  }
}

export class WellValidationError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'WELL_VALIDATION_ERROR', 400, true, context);
  }
}

export class WellStatusTransitionError extends DomainError {
  constructor(
    wellId: string,
    currentStatus: string,
    targetStatus: string,
    reason?: string,
  ) {
    const reasonSuffix = reason ? `: ${reason}` : '';
    const message = `Invalid status transition from '${currentStatus}' to '${targetStatus}'${reasonSuffix}`;
    super(message, 'WELL_STATUS_TRANSITION_ERROR', 400, true, {
      wellId,
      currentStatus,
      targetStatus,
      reason,
    });
  }
}

/**
 * External API integration errors
 */
export class ExternalApiError extends DomainError {
  constructor(
    message: string,
    serviceName: string,
    operation?: string,
    context?: Record<string, unknown>,
  ) {
    const operationSuffix = operation ? ` (${operation})` : '';
    const fullMessage = `External API error in ${serviceName}${operationSuffix}: ${message}`;
    super(fullMessage, 'EXTERNAL_API_ERROR', 502, true, {
      serviceName,
      operation,
      ...context,
    });
  }
}

export class CircuitBreakerOpenError extends DomainError {
  constructor(serviceName: string, operation?: string) {
    const operationSuffix = operation ? ` (${operation})` : '';
    const message = `Circuit breaker is open for service '${serviceName}'${operationSuffix}`;
    super(message, 'CIRCUIT_BREAKER_OPEN', 503, true, {
      serviceName,
      operation,
    });
  }
}

export class RetryExhaustedError extends DomainError {
  constructor(
    operation: string,
    attempts: number,
    lastError: string,
    context?: Record<string, unknown>,
  ) {
    const message = `Operation '${operation}' failed after ${attempts} attempts. Last error: ${lastError}`;
    super(message, 'RETRY_EXHAUSTED', 503, true, {
      operation,
      attempts,
      lastError,
      ...context,
    });
  }
}

/**
 * Business rule violations
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(rule: string, context?: Record<string, unknown>) {
    super(
      `Business rule violation: ${rule}`,
      'BUSINESS_RULE_VIOLATION',
      400,
      true,
      { rule, ...context },
    );
  }
}

/**
 * Authorization errors
 */
export class InsufficientPermissionsError extends DomainError {
  constructor(
    userId: string,
    requiredPermissions: string[],
    context?: Record<string, unknown>,
  ) {
    super(
      `User '${userId}' has insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
      'INSUFFICIENT_PERMISSIONS',
      403,
      true,
      { userId, requiredPermissions, ...context },
    );
  }
}

export class ResourceNotAccessibleError extends DomainError {
  constructor(resource: string, userId: string, reason?: string) {
    const reasonSuffix = reason ? `: ${reason}` : '';
    const message = `Resource '${resource}' is not accessible for user '${userId}'${reasonSuffix}`;
    super(message, 'RESOURCE_NOT_ACCESSIBLE', 403, true, {
      resource,
      userId,
      reason,
    });
  }
}

/**
 * Data integrity errors
 */
export class DataIntegrityError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATA_INTEGRITY_ERROR', 500, false, context);
  }
}

export class ConcurrentModificationError extends DomainError {
  constructor(
    resource: string,
    expectedVersion: number,
    actualVersion: number,
  ) {
    super(
      `Concurrent modification detected for ${resource}. Expected version: ${expectedVersion}, actual: ${actualVersion}`,
      'CONCURRENT_MODIFICATION',
      409,
      true,
      { resource, expectedVersion, actualVersion },
    );
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends DomainError {
  constructor(setting: string, context?: Record<string, unknown>) {
    super(
      `Configuration error: ${setting}`,
      'CONFIGURATION_ERROR',
      500,
      false,
      { setting, ...context },
    );
  }
}

/**
 * Validation errors
 */
export class ValidationError extends DomainError {
  constructor(message: string, field?: string, value?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, true, { field, value });
  }
}

/**
 * Error factory for creating appropriate error types
 */
export const ErrorFactory = {
  wellNotFound(wellId: string): WellNotFoundError {
    return new WellNotFoundError(wellId);
  },

  wellAlreadyExists(apiNumber: string): WellAlreadyExistsError {
    return new WellAlreadyExistsError(apiNumber);
  },

  wellValidation(
    message: string,
    context?: Record<string, unknown>,
  ): WellValidationError {
    return new WellValidationError(message, context);
  },

  invalidStatusTransition(
    wellId: string,
    currentStatus: string,
    targetStatus: string,
    reason?: string,
  ): WellStatusTransitionError {
    return new WellStatusTransitionError(
      wellId,
      currentStatus,
      targetStatus,
      reason,
    );
  },

  externalApi(
    message: string,
    serviceName: string,
    operation?: string,
    context?: Record<string, unknown>,
  ): ExternalApiError {
    return new ExternalApiError(message, serviceName, operation, context);
  },

  circuitBreakerOpen(
    serviceName: string,
    operation?: string,
  ): CircuitBreakerOpenError {
    return new CircuitBreakerOpenError(serviceName, operation);
  },

  retryExhausted(
    operation: string,
    attempts: number,
    lastError: string,
    context?: Record<string, unknown>,
  ): RetryExhaustedError {
    return new RetryExhaustedError(operation, attempts, lastError, context);
  },

  businessRuleViolation(
    rule: string,
    context?: Record<string, unknown>,
  ): BusinessRuleViolationError {
    return new BusinessRuleViolationError(rule, context);
  },

  insufficientPermissions(
    userId: string,
    requiredPermissions: string[],
    context?: Record<string, unknown>,
  ): InsufficientPermissionsError {
    return new InsufficientPermissionsError(
      userId,
      requiredPermissions,
      context,
    );
  },

  resourceNotAccessible(
    resource: string,
    userId: string,
    reason?: string,
  ): ResourceNotAccessibleError {
    return new ResourceNotAccessibleError(resource, userId, reason);
  },

  dataIntegrity(
    message: string,
    context?: Record<string, unknown>,
  ): DataIntegrityError {
    return new DataIntegrityError(message, context);
  },

  concurrentModification(
    resource: string,
    expectedVersion: number,
    actualVersion: number,
  ): ConcurrentModificationError {
    return new ConcurrentModificationError(
      resource,
      expectedVersion,
      actualVersion,
    );
  },

  configuration(
    setting: string,
    context?: Record<string, unknown>,
  ): ConfigurationError {
    return new ConfigurationError(setting, context);
  },

  validation(
    message: string,
    field?: string,
    value?: unknown,
  ): ValidationError {
    return new ValidationError(message, field, value);
  },
};
