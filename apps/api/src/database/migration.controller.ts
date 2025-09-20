import { Controller, Post, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MigrationService } from './migration.service';

@ApiTags('Database')
@Controller('database')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @Post('migrate')
  @ApiOperation({ 
    summary: 'Run database migrations',
    description: 'Runs all pending database migrations. Use this to initialize the database schema.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Migrations completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Migration failed' 
  })
  async runMigrations() {
    try {
      const result = await this.migrationService.runMigrations();
      
      if (!result.success) {
        throw new HttpException(
          result.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      
      return result;
    } catch (error) {
      throw new HttpException(
        `Migration failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('migration-status')
  @ApiOperation({ 
    summary: 'Check migration status',
    description: 'Checks if database tables exist and migration status.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Migration status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        tablesExist: { type: 'boolean' },
        migrationTable: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async checkMigrationStatus() {
    try {
      return await this.migrationService.checkMigrationStatus();
    } catch (error) {
      throw new HttpException(
        `Status check failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
