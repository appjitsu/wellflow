import { Module, forwardRef } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { TenantRlsService } from './tenant-rls.service';
import { TenantGuard } from './tenant.guard';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [forwardRef(() => DatabaseModule)],
  providers: [TenantContextService, TenantRlsService, TenantGuard],
  exports: [TenantContextService, TenantRlsService, TenantGuard],
})
export class TenantModule {
  // Multi-tenant context management module with RLS integration
}
