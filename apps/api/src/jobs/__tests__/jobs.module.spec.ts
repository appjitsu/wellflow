import { Test, TestingModule } from '@nestjs/testing';
import { JobsModule } from '../jobs.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SentryModule } from '../../sentry/sentry.module';
import { LogRocketModule } from '../../logrocket/logrocket.module';

describe('JobsModule', () => {
  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
        SentryModule,
        LogRocketModule,
        JobsModule,
      ],
    }).compile();

    expect(module).toBeDefined();
  });
});
