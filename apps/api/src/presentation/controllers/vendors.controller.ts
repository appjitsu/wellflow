import { Controller, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/**
 * Vendors Controller
 * RESTful API endpoints for vendor management
 * Follows OpenAPI/Swagger documentation standards
 * Temporarily simplified due to authorization issues
 */
@ApiTags('Vendors')
@Controller('vendors')
export class VendorsController {
  private readonly logger = new Logger(VendorsController.name);
}
