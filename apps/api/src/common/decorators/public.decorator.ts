import { SetMetadata } from '@nestjs/common';

/**
 * Public Decorator
 * Marks routes as public (bypasses JWT authentication)
 *
 * This decorator works with the existing JwtAuthGuard which checks
 * for the 'isPublic' metadata to determine if authentication is required
 */
export const Public = () => SetMetadata('isPublic', true);
