import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { TenantContextService } from './tenant-context.service';

interface AuthenticatedUser {
  id: string;
  organizationId: string;
  role: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) {
      return false;
    }

    // Set tenant context from authenticated user
    this.tenantContextService.setContext({
      organizationId: user.organizationId,
      userId: user.id,
      userRole: user.role,
    });

    return true;
  }
}
