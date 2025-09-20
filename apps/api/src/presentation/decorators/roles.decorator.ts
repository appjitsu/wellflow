import { SetMetadata } from '@nestjs/common';

/**
 * Roles Decorator
 * Used to specify required roles for endpoints
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
