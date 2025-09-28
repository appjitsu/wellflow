import { Test, TestingModule } from '@nestjs/testing';
import { UserRegisteredHandler } from '../user-registered.handler';
import { EmailService } from '../../services/email.service';

describe('UserRegisteredHandler', () => {
  let handler: UserRegisteredHandler;

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRegisteredHandler,
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    handler = module.get<UserRegisteredHandler>(UserRegisteredHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
