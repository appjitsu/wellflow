import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { TenantRlsService } from './tenant-rls.service';

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
    private readonly tenantRlsService: TenantRlsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) {
      return false;
    }

    try {
      // Set tenant context with RLS integration
      await this.tenantRlsService.setTenantContext({
        organizationId: user.organizationId,
        userId: user.id,
        userRole: user.role,
      });

      return true;
    } catch (error) {
      console.error('Failed to set tenant context:', error);
      return false;
    }
  }
}
