import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiHeader,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';

export interface ApiExample {
  summary: string;
  description?: string;
  value: any;
}

export interface EnhancedApiOperationOptions {
  summary: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  deprecated?: boolean;
  security?: any[];
  examples?: {
    request?: ApiExample[];
    response?: ApiExample[];
  };
  errorExamples?: {
    [statusCode: number]: ApiExample[];
  };
}

/**
 * Enhanced API operation decorator with examples and comprehensive documentation
 */
export function EnhancedApiOperation(options: EnhancedApiOperationOptions) {
  const decorators = [];

  // Base operation decorator
  decorators.push(
    ApiOperation({
      summary: options.summary,
      description: options.description,
      operationId: options.operationId,
      tags: options.tags,
      deprecated: options.deprecated,
    }),
  );

  // Request examples
  if (options.examples?.request) {
    decorators.push(
      ApiBody({
        examples: options.examples.request.reduce((acc, example, index) => {
          acc[`example-${index + 1}`] = {
            summary: example.summary,
            description: example.description,
            value: example.value,
          };
          return acc;
        }, {} as any),
      }),
    );
  }

  // Response examples
  if (options.examples?.response) {
    options.examples.response.forEach((example, index) => {
      decorators.push(
        ApiResponse({
          status: 200,
          description: example.summary,
          content: {
            'application/json': {
              example: example.value,
            },
          },
        }),
      );
    });
  }

  // Error examples
  if (options.errorExamples) {
    Object.entries(options.errorExamples).forEach(([statusCode, examples]) => {
      examples.forEach((example, index) => {
        decorators.push(
          ApiResponse({
            status: parseInt(statusCode),
            description: example.summary,
            content: {
              'application/json': {
                example: example.value,
              },
            },
          }),
        );
      });
    });
  }

  return applyDecorators(...decorators);
}

/**
 * Common API response examples
 */
export const CommonApiExamples = {
  SuccessResponse: {
    summary: 'Successful operation',
    value: {
      success: true,
      message: 'Operation completed successfully',
      data: {},
      timestamp: '2024-01-01T12:00:00.000Z',
    },
  },

  ValidationError: {
    summary: 'Validation failed',
    value: {
      statusCode: 400,
      message: 'Validation failed',
      error: 'Bad Request',
      errors: [
        {
          field: 'name',
          value: '',
          constraints: {
            isNotEmpty: 'name should not be empty',
          },
        },
      ],
    },
  },

  UnauthorizedError: {
    summary: 'Authentication required',
    value: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  },

  ForbiddenError: {
    summary: 'Insufficient permissions',
    value: {
      statusCode: 403,
      message: 'Forbidden resource',
      error: 'Forbidden',
    },
  },

  NotFoundError: {
    summary: 'Resource not found',
    value: {
      statusCode: 404,
      message: 'Resource not found',
      error: 'Not Found',
    },
  },

  ServerError: {
    summary: 'Internal server error',
    value: {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    },
  },
};

/**
 * Well-specific API examples
 */
export const WellApiExamples = {
  CreateWellRequest: {
    summary: 'Create a new oil well',
    description:
      'Example request to create a new oil well with all required fields',
    value: {
      name: 'Well #1 - North Field',
      apiNumber: '42123456789000',
      operatorId: 'operator-123',
      wellType: 'OIL',
      location: {
        coordinates: {
          latitude: 35.123456,
          longitude: -101.123456,
        },
        address: '123 Main St',
        county: 'County Name',
        state: 'TX',
        country: 'USA',
      },
      leaseId: 'lease-456',
      spudDate: '2024-01-15',
      totalDepth: 8500,
    },
  },

  CreateWellResponse: {
    summary: 'Well created successfully',
    value: {
      success: true,
      message: 'Well created successfully',
      data: {
        id: 'well-789',
        name: 'Well #1 - North Field',
        apiNumber: '42123456789000',
        status: 'ACTIVE',
        createdAt: '2024-01-01T12:00:00.000Z',
        updatedAt: '2024-01-01T12:00:00.000Z',
      },
      timestamp: '2024-01-01T12:00:00.000Z',
    },
  },

  WellNotFoundError: {
    summary: 'Well not found',
    value: {
      statusCode: 404,
      message: 'Well with ID well-999 was not found',
      error: 'Not Found',
    },
  },

  WellValidationError: {
    summary: 'Invalid well data',
    value: {
      statusCode: 400,
      message: 'Validation failed',
      error: 'Bad Request',
      errors: [
        {
          field: 'apiNumber',
          value: '123',
          constraints: {
            length: 'API number must be exactly 14 digits',
          },
        },
        {
          field: 'location.coordinates.latitude',
          value: 91,
          constraints: {
            max: 'Latitude must be between -90 and 90 degrees',
          },
        },
      ],
    },
  },
};

/**
 * Pagination examples
 */
export const PaginationExamples = {
  PaginatedResponse: {
    summary: 'Paginated results',
    value: {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 150,
        totalPages: 8,
        hasNextPage: true,
        hasPrevPage: false,
      },
      timestamp: '2024-01-01T12:00:00.000Z',
    },
  },

  PaginationParams: {
    summary: 'Pagination query parameters',
    value: {
      page: 2,
      limit: 50,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  },
};

/**
 * Audit log examples
 */
export const AuditLogExamples = {
  AuditLogEntry: {
    summary: 'Audit log entry',
    value: {
      id: 'audit-123',
      userId: 'user-456',
      organizationId: 'org-789',
      action: 'CREATE',
      resourceType: 'WELL',
      resourceId: 'well-101',
      timestamp: '2024-01-01T12:00:00.000Z',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      success: true,
      endpoint: '/api/v2/wells',
      method: 'POST',
      duration: 150,
    },
  },
};

/**
 * Health check examples
 */
export const HealthCheckExamples = {
  HealthyResponse: {
    summary: 'All systems healthy',
    value: {
      status: 'healthy',
      timestamp: '2024-01-01T12:00:00.000Z',
      uptime: 86400000, // 24 hours in ms
      version: '2.0.0',
      checks: {
        database: {
          status: 'healthy',
          responseTime: 45,
          details: {
            connectionCount: 5,
            queryTime: 45,
          },
        },
        redis: {
          status: 'healthy',
          responseTime: 12,
          details: {
            version: '7.0.5',
            connections: 10,
          },
        },
        circuit_breaker: {
          status: 'healthy',
          responseTime: 5,
          details: {
            totalBreakers: 3,
            unhealthyBreakers: 0,
          },
        },
      },
    },
  },

  UnhealthyResponse: {
    summary: 'Some systems unhealthy',
    value: {
      status: 'unhealthy',
      timestamp: '2024-01-01T12:00:00.000Z',
      uptime: 3600000, // 1 hour in ms
      version: '2.0.0',
      checks: {
        database: {
          status: 'healthy',
          responseTime: 45,
        },
        redis: {
          status: 'unhealthy',
          responseTime: 5000,
          error: 'Connection timeout',
        },
        circuit_breaker: {
          status: 'degraded',
          responseTime: 8,
          details: {
            totalBreakers: 3,
            unhealthyBreakers: 1,
          },
        },
      },
    },
  },
};

/**
 * Security examples
 */
export const SecurityExamples = {
  SecurityViolation: {
    summary: 'Security violation detected',
    value: {
      statusCode: 400,
      message: 'Security violation detected',
      code: 'SECURITY_VIOLATION',
      violations: [
        {
          type: 'xss',
          severity: 'high',
          field: 'description',
          description: 'Detected XSS pattern in field description',
        },
      ],
    },
  },
};
