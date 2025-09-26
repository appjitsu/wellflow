import { Module, Global } from '@nestjs/common';
import { VersionService } from './version.service';
import { VersionInterceptor } from './version.interceptor';
import { VersionGuard } from './version.guard';

@Global()
@Module({
  providers: [VersionService, VersionInterceptor, VersionGuard],
  exports: [VersionService, VersionInterceptor, VersionGuard],
})
export class VersioningModule {}
