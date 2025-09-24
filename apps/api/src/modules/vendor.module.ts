import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Controllers
import { VendorsController } from '../presentation/controllers/vendors.controller';

// Command Handlers
import { CreateVendorHandler } from '../application/handlers/create-vendor.handler';
import { UpdateVendorStatusHandler } from '../application/handlers/update-vendor-status.handler';
import { UpdateVendorInsuranceHandler } from '../application/handlers/update-vendor-insurance.handler';
import { AddVendorCertificationHandler } from '../application/handlers/add-vendor-certification.handler';
import { UpdateVendorPerformanceHandler } from '../application/handlers/update-vendor-performance.handler';

// Query Handlers
import { GetVendorByIdHandler } from '../application/handlers/get-vendor-by-id.handler';
import { GetVendorsByOrganizationHandler } from '../application/handlers/get-vendors-by-organization.handler';
import { GetVendorStatisticsHandler } from '../application/handlers/get-vendor-statistics.handler';
import { GetVendorsWithExpiringQualificationsHandler } from '../application/handlers/get-vendors-with-expiring-qualifications.handler';

// Event Handlers
import { VendorCreatedHandler } from '../infrastructure/event-handlers/vendor-created.handler';
import { VendorStatusChangedHandler } from '../infrastructure/event-handlers/vendor-status-changed.handler';
import { VendorQualificationUpdatedHandler } from '../infrastructure/event-handlers/vendor-qualification-updated.handler';

// Repository Implementation
import { VendorRepositoryImpl } from '../infrastructure/repositories/vendor.repository';

// Database Module
import { DatabaseModule } from '../database/database.module';

/**
 * Vendor Module
 * Configures the vendor management domain following Clean Architecture principles
 *
 * This module follows the dependency inversion principle by:
 * - Controllers depend on abstractions (CommandBus, QueryBus)
 * - Application layer depends on repository interfaces
 * - Infrastructure layer implements the interfaces
 * - Domain layer has no dependencies on other layers
 */
@Module({
  imports: [CqrsModule, DatabaseModule],
  controllers: [VendorsController],
  providers: [
    // Command Handlers
    CreateVendorHandler,
    UpdateVendorStatusHandler,
    UpdateVendorInsuranceHandler,
    AddVendorCertificationHandler,
    UpdateVendorPerformanceHandler,

    // Query Handlers
    GetVendorByIdHandler,
    GetVendorsByOrganizationHandler,
    GetVendorStatisticsHandler,
    GetVendorsWithExpiringQualificationsHandler,

    // Event Handlers
    VendorCreatedHandler,
    VendorStatusChangedHandler,
    VendorQualificationUpdatedHandler,

    // Repository Implementation
    {
      provide: 'VendorRepository',
      useClass: VendorRepositoryImpl,
    },
  ],
  exports: ['VendorRepository'],
})
export class VendorModule {}
