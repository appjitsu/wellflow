import { Test, TestingModule } from '@nestjs/testing';
import { UserEmailVerifiedHandler } from '../user-email-verified.handler';
import { EmailService } from '../../services/email.service';

describe('UserEmailVerifiedHandler', () => {
  let handler: UserEmailVerifiedHandler;

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserEmailVerifiedHandler,
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    handler = module.get<UserEmailVerifiedHandler>(UserEmailVerifiedHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
