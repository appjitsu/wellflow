import { Module, forwardRef } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { TenantRlsService } from './tenant-rls.service';
import { TenantGuard } from './tenant.guard';
import { DatabaseModule } from '../../database/database.module';
import { TenantInfrastructureModule } from '../../infrastructure/tenant/tenant-infrastructure.module';

@Module({
  imports: [forwardRef(() => DatabaseModule), TenantInfrastructureModule],
  providers: [TenantContextService, TenantRlsService, TenantGuard],
  exports: [
    TenantContextService,
    TenantRlsService,
    TenantGuard,
    // Re-export infrastructure services for convenience
    TenantInfrastructureModule,
  ],
})
export class TenantModule {
  // Multi-tenant context management module with RLS integration
}
