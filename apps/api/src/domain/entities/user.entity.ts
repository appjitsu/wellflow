import { Email } from '../value-objects/email';
import { Password } from '../value-objects/password';
import { AuthToken } from '../value-objects/auth-token';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { UserLoggedInEvent } from '../events/user-logged-in.event';
import { UserAccountLockedEvent } from '../events/user-account-locked.event';
import { UserEmailVerifiedEvent } from '../events/user-email-verified.event';

/**
 * User Domain Entity (Aggregate Root)
 * Represents a system user with authentication capabilities
 *
 * Business Rules:
 * - Email must be unique within the system
 * - Account locks after 5 failed login attempts (Sprint 3)
 * - Email verification required for new accounts
 * - Password must meet complexity requirements
 * - Users belong to an organization (multi-tenant)
 */
export class User {
  private domainEvents: unknown[] = [];

  constructor(
    private readonly id: string,
    private readonly organizationId: string,
    private email: Email,
    private firstName: string,
    private lastName: string,
    private role: UserRole,
    private phone?: string,
    private passwordHash?: string,
    private emailVerified: boolean = false,
    private emailVerificationToken?: string,
    private emailVerificationExpiresAt?: Date,
    private failedLoginAttempts: number = 0,
    private lockedUntil?: Date,
    private passwordResetToken?: string,
    private passwordResetExpiresAt?: Date,
    private isActive: boolean = true,
    private lastLoginAt?: Date,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
  ) {}

  // Getters
  getId(): string {
    return this.id;
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  getEmail(): Email {
    return this.email;
  }

  getFirstName(): string {
    return this.firstName;
  }

  getLastName(): string {
    return this.lastName;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getRole(): UserRole {
    return this.role;
  }

  getPhone(): string | undefined {
    return this.phone;
  }

  isEmailVerified(): boolean {
    return this.emailVerified;
  }

  isAccountLocked(): boolean {
    return this.lockedUntil ? new Date() < this.lockedUntil : false;
  }

  getFailedLoginAttempts(): number {
    return this.failedLoginAttempts;
  }

  getLastLoginAt(): Date | undefined {
    return this.lastLoginAt;
  }

  isAccountActive(): boolean {
    return this.isActive;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Authentication field getters for repository mapping
  getPasswordHash(): string | undefined {
    return this.passwordHash;
  }

  getEmailVerificationToken(): string | undefined {
    return this.emailVerificationToken;
  }

  getEmailVerificationExpiresAt(): Date | undefined {
    return this.emailVerificationExpiresAt;
  }

  getLockedUntil(): Date | undefined {
    return this.lockedUntil;
  }

  getPasswordResetToken(): string | undefined {
    return this.passwordResetToken;
  }

  getPasswordResetExpiresAt(): Date | undefined {
    return this.passwordResetExpiresAt;
  }

  // Factory method for reconstructing users from database
  static fromDatabase(
    id: string,
    organizationId: string,
    email: string,
    firstName: string,
    lastName: string,
    role: UserRole,
    phone: string | undefined,
    passwordHash: string,
    emailVerified: boolean,
    emailVerificationToken?: string | null,
    emailVerificationExpiresAt?: Date | null,
    failedLoginAttempts?: number,
    lockedUntil?: Date | null,
    passwordResetToken?: string | null,
    passwordResetExpiresAt?: Date | null,
    isActive?: boolean,
    lastLoginAt?: Date | null,
    createdAt?: Date,
    updatedAt?: Date,
  ): User {
    const emailVO = Email.create(email);

    return new User(
      id,
      organizationId,
      emailVO,
      firstName,
      lastName,
      role,
      phone,
      passwordHash,
      emailVerified,
      emailVerificationToken || undefined,
      emailVerificationExpiresAt || undefined,
      failedLoginAttempts || 0,
      lockedUntil || undefined,
      passwordResetToken || undefined,
      passwordResetExpiresAt || undefined,
      isActive ?? true,
      lastLoginAt || undefined,
      createdAt || new Date(),
      updatedAt || new Date(),
    );
  }

  // Factory method for creating new users
  static async create(
    organizationId: string,
    email: string,
    firstName: string,
    lastName: string,
    role: UserRole,
    plainTextPassword: string,
    phone?: string,
  ): Promise<User> {
    const emailVO = Email.create(email);
    const password = await Password.create(plainTextPassword);
    const id = crypto.randomUUID();

    const user = new User(
      id,
      organizationId,
      emailVO,
      firstName,
      lastName,
      role,
      phone,
      password.getHashedValue(),
      false, // Email not verified initially
    );

    // Generate email verification token
    const verificationToken = AuthToken.createEmailVerificationToken();
    user.emailVerificationToken = verificationToken.getValue();
    user.emailVerificationExpiresAt = verificationToken.getExpiresAt();

    // Raise domain event
    user.addDomainEvent(
      new UserRegisteredEvent(
        user.id,
        user.organizationId,
        user.email.getValue(),
        user.firstName,
        user.lastName,
        user.role,
        true, // Requires email verification
      ),
    );

    return user;
  }

  // Authentication methods
  async validatePassword(plainTextPassword: string): Promise<boolean> {
    if (!this.passwordHash) {
      return false;
    }

    const password = Password.fromHash(this.passwordHash);
    return password.verify(plainTextPassword);
  }

  recordSuccessfulLogin(ipAddress?: string, userAgent?: string): void {
    if (this.isAccountLocked()) {
      throw new Error('Cannot login: account is locked');
    }

    if (!this.isActive) {
      throw new Error('Cannot login: account is inactive');
    }

    // Reset failed attempts on successful login
    this.failedLoginAttempts = 0;
    this.lockedUntil = undefined;
    this.lastLoginAt = new Date();
    this.updatedAt = new Date();

    this.addDomainEvent(
      new UserLoggedInEvent(
        this.id,
        this.organizationId,
        this.email.getValue(),
        ipAddress,
        userAgent,
      ),
    );
  }

  recordFailedLoginAttempt(ipAddress?: string, userAgent?: string): void {
    this.failedLoginAttempts += 1;
    this.updatedAt = new Date();

    // Lock account after 5 failed attempts (Sprint 3 requirement)
    if (this.failedLoginAttempts >= 5) {
      // Lock for 30 minutes
      this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);

      this.addDomainEvent(
        new UserAccountLockedEvent(
          this.id,
          this.organizationId,
          this.email.getValue(),
          this.failedLoginAttempts,
          this.lockedUntil,
          ipAddress,
          userAgent,
        ),
      );
    }
  }

  verifyEmail(token: string): void {
    if (this.emailVerified) {
      return; // Already verified
    }

    if (!this.emailVerificationToken || !this.emailVerificationExpiresAt) {
      throw new Error('No email verification token found');
    }

    if (this.emailVerificationToken !== token) {
      throw new Error('Invalid email verification token');
    }

    if (new Date() > this.emailVerificationExpiresAt) {
      throw new Error('Email verification token has expired');
    }

    this.emailVerified = true;
    this.emailVerificationToken = undefined;
    this.emailVerificationExpiresAt = undefined;
    this.updatedAt = new Date();

    this.addDomainEvent(
      new UserEmailVerifiedEvent(
        this.id,
        this.organizationId,
        this.email.getValue(),
        new Date(),
      ),
    );
  }

  generatePasswordResetToken(): AuthToken {
    const resetToken = AuthToken.createPasswordResetToken();
    this.passwordResetToken = resetToken.getValue();
    this.passwordResetExpiresAt = resetToken.getExpiresAt();
    this.updatedAt = new Date();

    return resetToken;
  }

  async resetPassword(
    token: string,
    newPlainTextPassword: string,
  ): Promise<void> {
    if (!this.passwordResetToken || !this.passwordResetExpiresAt) {
      throw new Error('No password reset token found');
    }

    if (this.passwordResetToken !== token) {
      throw new Error('Invalid password reset token');
    }

    if (new Date() > this.passwordResetExpiresAt) {
      throw new Error('Password reset token has expired');
    }

    const newPassword = await Password.create(newPlainTextPassword);
    this.passwordHash = newPassword.getHashedValue();
    this.passwordResetToken = undefined;
    this.passwordResetExpiresAt = undefined;
    this.failedLoginAttempts = 0; // Reset failed attempts
    this.lockedUntil = undefined; // Unlock account
    this.updatedAt = new Date();
  }

  // Domain events management
  addDomainEvent(event: unknown): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): unknown[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}

/**
 * User Role Enum
 */
export enum UserRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  PUMPER = 'pumper',
}
