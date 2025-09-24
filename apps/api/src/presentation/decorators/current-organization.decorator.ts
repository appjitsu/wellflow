import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface RequestWithUser {
  user?: {
    organizationId?: string;
  };
}

/**
 * Current Organization Decorator
 * Extracts the current organization ID from the authenticated user
 */
export const CurrentOrganization = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user?.organizationId;
  },
);
