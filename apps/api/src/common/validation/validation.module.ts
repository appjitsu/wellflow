import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { EnhancedValidationPipe } from './enhanced-validation.pipe';
import { SecurityValidationPipe } from './security-validation.pipe';

@Module({
  providers: [
    EnhancedValidationPipe,
    SecurityValidationPipe,
    // Global validation pipes
    {
      provide: APP_PIPE,
      useClass: EnhancedValidationPipe,
    },
    {
      provide: APP_PIPE,
      useClass: SecurityValidationPipe,
    },
  ],
  exports: [
    EnhancedValidationPipe,
    SecurityValidationPipe,
  ],
})
export class ValidationModule {}