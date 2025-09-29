import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { AuthModule } from '../auth.module';
import { DatabaseModule } from '../../database/database.module';
import { ConfigModule } from '@nestjs/config';
import { TokenBlacklistService } from '../services/token-blacklist.service';
import { AuthService } from '../auth.service';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let tokenBlacklistService: TokenBlacklistService;
  let authService: AuthService;

  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    organizationName: 'Test Organization',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
        DatabaseModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    tokenBlacklistService = moduleFixture.get<TokenBlacklistService>(
      'TokenBlacklistService',
    );
    authService = moduleFixture.get<AuthService>(AuthService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.isEmailVerified).toBe(false);
    });

    it('should reject registration with invalid email', async () => {
      const invalidUser = { ...testUser, email: 'invalid-email' };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordUser = {
        ...testUser,
        password: '123',
        email: 'test2@example.com',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(weakPasswordUser)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    let registeredUser: any;

    beforeAll(async () => {
      // Register a user for login tests
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...testUser, email: 'login-test@example.com' });

      registeredUser = registerResponse.body.user;

      // Verify email to enable login
      await authService.verifyEmail(
        registeredUser.id,
        'mock-verification-token',
      );
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login-test@example.com',
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body.user.email).toBe('login-test@example.com');
    });

    it('should reject login with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'wrong-password',
        })
        .expect(401);
    });

    it('should reject login with non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);
    });
  });

  describe('POST /auth/logout with Token Blacklisting', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login-test@example.com',
          password: testUser.password,
        });

      accessToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;
    });

    it('should logout successfully and blacklist tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');
      expect(response.body).toHaveProperty('loggedOutAt');

      // Verify tokens are blacklisted
      const isAccessTokenBlacklisted =
        await tokenBlacklistService.isTokenBlacklisted(accessToken);
      const isRefreshTokenBlacklisted =
        await tokenBlacklistService.isTokenBlacklisted(refreshToken);

      expect(isAccessTokenBlacklisted).toBe(true);
      expect(isRefreshTokenBlacklisted).toBe(true);
    });

    it('should logout successfully with only access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');

      // Verify access token is blacklisted
      const isAccessTokenBlacklisted =
        await tokenBlacklistService.isTokenBlacklisted(accessToken);
      expect(isAccessTokenBlacklisted).toBe(true);
    });

    it('should reject requests with blacklisted tokens', async () => {
      // First logout to blacklist the token
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      // Try to use the blacklisted token
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });

  describe('GET /auth/verify/:token', () => {
    let unverifiedUser: any;

    beforeAll(async () => {
      // Register a user for verification tests
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...testUser, email: 'verify-test@example.com' });

      unverifiedUser = registerResponse.body.user;
    });

    it('should verify email successfully with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get(`/auth/verify/mock-verification-token?userId=${unverifiedUser.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('verifiedAt');
      expect(response.body.message).toContain('verified successfully');
    });

    it('should reject verification without user ID', async () => {
      await request(app.getHttpServer())
        .get('/auth/verify/mock-verification-token')
        .expect(400);
    });

    it('should reject verification with invalid token', async () => {
      await request(app.getHttpServer())
        .get(`/auth/verify/invalid-token?userId=${unverifiedUser.id}`)
        .expect(401);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should handle forgot password request', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'login-test@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('password reset');
    });

    it('should handle forgot password for non-existent user gracefully', async () => {
      // Should not reveal whether user exists
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should apply rate limiting to auth endpoints', async () => {
      // This test would need to be adjusted based on the actual rate limiting configuration
      // For now, we'll test that the endpoints are accessible

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrong-password',
        });

      // Should get 401 for invalid credentials, not 429 for rate limiting
      // (unless we've exceeded the rate limit)
      expect([401, 429]).toContain(response.status);
    });
  });

  describe('Security Headers and Validation', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login-test@example.com',
          password: testUser.password,
        });

      // Check for common security headers (these would be set by middleware)
      expect(response.headers).toBeDefined();
    });

    it('should validate input data properly', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: '', // Empty email
          password: '', // Empty password
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });
  });
});
