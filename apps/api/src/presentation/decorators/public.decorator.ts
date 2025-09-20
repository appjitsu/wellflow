import { SetMetadata } from '@nestjs/common';

/**
 * Public Decorator
 * Used to mark endpoints as public (no authentication required)
 */
export const Public = () => SetMetadata('isPublic', true);
