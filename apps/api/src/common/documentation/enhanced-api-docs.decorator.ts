import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiHeader,
  ApiConsumes,
  ApiProduces,
} from '@nestjs/swagger';
import { EnhancedApiOperation, CommonApiExamples, WellApiExamples } from './api-examples.decorator';

export interface EnhancedApiDocsOptions {
  // Basic info
  tags?: string[];
  summary: string;
  description?: string;
  operationId?: string;

  // Authentication
  requiresAuth?: boolean;

  // Content types
  consumes?: string[];
  produces?: string[];

  // Parameters
  params?: {
    path?: Array<{ name: string; type: any; description?: string; example?: any }>;
    query?: Array<{ name: string; type: any; description?: string; required?: boolean; example?: any }>;
    headers?: Array<{ name: string; type: any; description?: string; required?: boolean; example?: any }>;
  };

  // Request/Response
  requestBody?: {
    type: any;
    description?: string;
    required?: boolean;
    examples?: any[];
  };

  responses?: {
    [statusCode: number]: {
      type?: any;
      description: string;
      examples?: any[];
    };
  };

  // Additional metadata
  deprecated?: boolean;
  deprecationMessage?: string;
  rateLimit?: {
    requests: number;
    period: string; // e.g., '1 minute', '1 hour'
  };
  cache?: {
    ttl: number; // seconds
    varyBy?: string[]; // headers/parameters to vary cache by
  };

  // Business context
  businessRules?: string[];
  compliance?: string[];
}

/**
 * Enhanced API documentation decorator that provides comprehensive documentation
 */
export function EnhancedApiDocs(options: EnhancedApiDocsOptions) {
  const decorators = [];

  // Tags
  if (options.tags) {
    decorators.push(ApiTags(...options.tags));
  }

  // Authentication
  if (options.requiresAuth !== false) {
    decorators.push(ApiBearerAuth());
  }

  // Content types
  if (options.consumes) {
    decorators.push(ApiConsumes(...options.consumes));
  }
  if (options.produces) {
    decorators.push(ApiProduces(...options.produces));
  }

  // Path parameters
  if (options.params?.path) {
    options.params.path.forEach(param => {
      decorators.push(
        ApiParam({
          name: param.name,
          type: param.type,
          description: param.description,
          example: param.example,
        }),
      );
    });
  }

  // Query parameters
  if (options.params?.query) {
    options.params.query.forEach(param => {
      decorators.push(
        ApiQuery({
          name: param.name,
          type: param.type,
          description: param.description,
          required: param.required,
          example: param.example,
        }),
      );
    });
  }

  // Headers
  if (options.params?.headers) {
    options.params.headers.forEach(header => {
      decorators.push(
        ApiHeader({
          name: header.name,
          type: header.type,
          description: header.description,
          required: header.required,
          example: header.example,
        }),
      );
    });
  }

  // Request body
  if (options.requestBody) {
    decorators.push(
      ApiBody({
        type: options.requestBody.type,
        description: options.requestBody.description,
        required: options.requestBody.required,
      }),
    );
  }

  // Responses
  if (options.responses) {
    Object.entries(options.responses).forEach(([statusCode, response]) => {
      decorators.push(
        ApiResponse({
          status: parseInt(statusCode),
          type: response.type,
          description: response.description,
        }),
      );
    });
  }

  // Add common error responses if not explicitly defined
  if (!options.responses?.[400]) {
    decorators.push(
      ApiResponse({
        status: 400,
        description: 'Bad Request - Validation failed',
      }),
    );
  }

  if (!options.responses?.[401]) {
    decorators.push(
      ApiResponse({
        status: 401,
        description: 'Unauthorized - Authentication required',
      }),
    );
  }

  if (!options.responses?.[403]) {
    decorators.push(
      ApiResponse({
        status: 403,
        description: 'Forbidden - Insufficient permissions',
      }),
    );
  }

  if (!options.responses?.[404]) {
    decorators.push(
      ApiResponse({
        status: 404,
        description: 'Not Found - Resource does not exist',
      }),
    );
  }

  if (!options.responses?.[500]) {
    decorators.push(
      ApiResponse({
        status: 500,
        description: 'Internal Server Error',
      }),
    );
  }

  // Operation with enhanced details
  const operationDescription = [
    options.description,
    options.deprecated ? `\n\n⚠️ **DEPRECATED**: ${options.deprecationMessage || 'This endpoint is deprecated and will be removed in a future version.'}` : '',
    options.rateLimit ? `\n\n📊 **Rate Limit**: ${options.rateLimit.requests} requests per ${options.rateLimit.period}` : '',
    options.cache ? `\n\n💾 **Cache**: ${options.cache.ttl} seconds TTL${options.cache.varyBy ? ` (varies by: ${options.cache.varyBy.join(', ')})` : ''}` : '',
    options.businessRules?.length ? `\n\n📋 **Business Rules**:\n${options.businessRules.map(rule => `• ${rule}`).join('\n')}` : '',
    options.compliance?.length ? `\n\n🔒 **Compliance**: ${options.compliance.join(', ')}` : '',
  ].filter(Boolean).join('');

  decorators.push(
    ApiOperation({
      summary: options.summary,
      description: operationDescription,
      operationId: options.operationId,
      deprecated: options.deprecated,
    }),
  );

  return applyDecorators(...decorators);
}

/**
 * Pre-configured decorators for common WellFlow API patterns
 */
export const WellFlowApiDocs = {
  // Well CRUD operations
  CreateWell: EnhancedApiDocs({
    tags: ['Wells'],
    summary: 'Create a new well',
    description: 'Creates a new oil/gas well with comprehensive validation and audit logging.',
    operationId: 'createWell',
    requestBody: {
      type: Object,
      description: 'Well creation data',
      required: true,
    },
    responses: {
      201: {
        description: 'Well created successfully',
      },
    },
    businessRules: [
      'API number must be unique and follow 14-digit format',
      'Coordinates must be within valid geographical bounds',
      'Operator must have appropriate permissions',
      'Lease association must be valid',
    ],
    compliance: ['API-1164', 'IEC-62443'],
    rateLimit: { requests: 10, period: '1 minute' },
  }),

  GetWell: EnhancedApiDocs({
    tags: ['Wells'],
    summary: 'Get well by ID',
    description: 'Retrieves detailed information about a specific well including related data.',
    operationId: 'getWell',
    params: {
      path: [{
        name: 'id',
        type: String,
        description: 'Well unique identifier',
        example: 'well-123',
      }],
    },
    responses: {
      200: {
        description: 'Well data retrieved successfully',
      },
    },
    cache: { ttl: 300, varyBy: ['user.role'] },
  }),

  UpdateWell: EnhancedApiDocs({
    tags: ['Wells'],
    summary: 'Update well information',
    description: 'Updates well data with change tracking and validation.',
    operationId: 'updateWell',
    params: {
      path: [{
        name: 'id',
        type: String,
        description: 'Well unique identifier',
        example: 'well-123',
      }],
    },
    requestBody: {
      type: Object,
      description: 'Well update data',
      required: true,
    },
    responses: {
      200: {
        description: 'Well updated successfully',
      },
    },
    businessRules: [
      'Only authorized users can update well data',
      'Status transitions must follow business rules',
      'All changes are audit logged',
    ],
  }),

  // Health checks
  HealthCheck: EnhancedApiDocs({
    tags: ['Health'],
    summary: 'System health check',
    description: 'Comprehensive health check of all system components.',
    operationId: 'healthCheck',
    requiresAuth: false,
    responses: {
      200: {
        description: 'All systems healthy',
      },
      503: {
        description: 'Some systems unhealthy',
      },
    },
  }),

  // Audit logs
  GetAuditLogs: EnhancedApiDocs({
    tags: ['Audit'],
    summary: 'Search audit logs',
    description: 'Search and filter audit logs with advanced querying capabilities.',
    operationId: 'searchAuditLogs',
    params: {
      query: [
        { name: 'userId', type: String, description: 'Filter by user ID', required: false },
        { name: 'action', type: String, description: 'Filter by action type', required: false },
        { name: 'resourceType', type: String, description: 'Filter by resource type', required: false },
        { name: 'startDate', type: String, description: 'Start date filter', required: false },
        { name: 'endDate', type: String, description: 'End date filter', required: false },
        { name: 'page', type: Number, description: 'Page number', required: false, example: 1 },
        { name: 'limit', type: Number, description: 'Items per page', required: false, example: 50 },
      ],
    },
    responses: {
      200: {
        description: 'Audit logs retrieved successfully',
      },
    },
    compliance: ['SOX', 'PCI-DSS'],
  }),

  // Version info
  ApiVersions: EnhancedApiDocs({
    tags: ['API'],
    summary: 'Get API version information',
    description: 'Returns information about available API versions and their features.',
    operationId: 'getApiVersions',
    requiresAuth: false,
    responses: {
      200: {
        description: 'API version information',
      },
    },
  }),
};
