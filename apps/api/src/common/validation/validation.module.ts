import { Module } from '@nestjs/common';
import { EnhancedValidationPipe } from './enhanced-validation.pipe';
import { SecurityValidationPipe } from './security-validation.pipe';
import { ValidationService } from './validation.service';

@Module({
  providers: [
    ValidationService,
    EnhancedValidationPipe,
    SecurityValidationPipe,
    // Note: Global validation pipes removed to avoid conflicts with standard ValidationPipe
    // EnhancedValidationPipe and SecurityValidationPipe can be used manually where needed
  ],
  exports: [ValidationService, EnhancedValidationPipe, SecurityValidationPipe],
})
export class ValidationModule {}
