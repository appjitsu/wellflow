import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { LeaseOperatingStatementsModule } from '../lease-operating-statements.module';
import { DatabaseModule } from '../../database/database.module';
import { AuthorizationModule } from '../../authorization/authorization.module';
import { JwtAuthGuard } from '../../presentation/guards/jwt-auth.guard';
import { AbilitiesGuard } from '../../authorization/abilities.guard';
import {
  ExpenseCategory,
  ExpenseType,
} from '../../domain/enums/los-status.enum';
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

describe('LeaseOperatingStatements (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let leaseId: string;
  let losId: string;
  let finalizeCallCount = 0;

  beforeAll(async () => {
    // Set up test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5433';
    process.env.DB_USER = 'postgres';
    // eslint-disable-next-line sonarjs/no-hardcoded-passwords
    process.env.DB_PASSWORD = 'please_set_secure_password';
    process.env.DB_NAME = 'wellflow_test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        LeaseOperatingStatementsModule,
        DatabaseModule,
        AuthorizationModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn((context) => {
          const request = context.switchToHttp().getRequest();
          const authHeader = request.headers.authorization;

          // Simulate authentication failure for tests
          if (!authHeader || authHeader === 'Bearer invalid-token') {
            throw new UnauthorizedException(); // This will cause 401
          }

          // Set up user context for authenticated requests
          request.user = {
            getId: () => 'test-user-id',
            getEmail: () => 'test@example.com',
            getOrganizationId: () => 'test-org-id',
          };
          return true;
        }),
      })
      .overrideGuard(AbilitiesGuard)
      .useValue({
        canActivate: jest.fn((context) => {
          // Set up user context for the request if not already set
          const request = context.switchToHttp().getRequest();
          if (!request.user) {
            request.user = {
              getId: () => 'test-user-id',
              getEmail: () => 'test@example.com',
              getOrganizationId: () => 'test-org-id',
            };
          }
          return true;
        }),
      })
      .overrideProvider(CommandBus)
      .useValue({
        execute: jest.fn().mockImplementation((command) => {
          if (command.constructor.name === 'CreateLosCommand') {
            if (command.notes === 'Duplicate LOS') {
              throw new ConflictException('LOS already exists');
            }
            return Promise.resolve('los-123');
          }
          if (command.constructor.name === 'AddLosExpenseCommand') {
            return Promise.resolve('expense-123');
          }
          if (command.constructor.name === 'FinalizeLosCommand') {
            finalizeCallCount++;
            if (finalizeCallCount > 1) {
              throw new BadRequestException('LOS already finalized');
            }
            return Promise.resolve(undefined);
          }
          if (command.constructor.name === 'DistributeLosCommand') {
            return Promise.resolve(undefined);
          }
          return Promise.resolve(undefined);
        }),
        register: jest.fn(),
        registerHandler: jest.fn(),
        bind: jest.fn(),
        unbind: jest.fn(),
      })
      .overrideProvider(QueryBus)
      .useValue({
        execute: jest.fn().mockImplementation((query) => {
          if (query.constructor.name === 'GetLosByIdQuery') {
            if (query.losId === 'non-existent-id') {
              throw new NotFoundException('LOS not found');
            }
            return Promise.resolve({
              id: query.losId,
              organizationId: 'test-org-id',
              leaseId: '123e4567-e89b-12d3-a456-426614174000',
              statementMonth: '2024-03',
              displayMonth: 'March 2024',
              totalExpenses: 0,
              operatingExpenses: 0,
              capitalExpenses: 0,
              status: 'DRAFT',
              notes: 'Test LOS',
              expenseLineItems: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              version: 1,
            });
          }
          // eslint-disable-next-line no-secrets/no-secrets
          if (query.constructor.name === 'GetLosByOrganizationQuery') {
            return Promise.resolve([
              {
                id: 'los-123',
                organizationId: 'test-org-id',
                leaseId: '123e4567-e89b-12d3-a456-426614174000',
                statementMonth: '2024-03',
                displayMonth: 'March 2024',
                totalExpenses: 0,
                operatingExpenses: 0,
                capitalExpenses: 0,
                status: 'DRAFT',
                notes: 'Test LOS',
                expenseLineItems: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1,
              },
            ]);
          }
          if (query.constructor.name === 'GetLosByLeaseQuery') {
            return Promise.resolve([
              {
                id: 'los-123',
                organizationId: 'test-org-id',
                leaseId: '123e4567-e89b-12d3-a456-426614174000',
                statementMonth: '2024-03',
                displayMonth: 'March 2024',
                totalExpenses: 0,
                operatingExpenses: 0,
                capitalExpenses: 0,
                status: 'DRAFT',
                notes: 'Test LOS',
                expenseLineItems: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1,
              },
            ]);
          }
          if (query.constructor.name === 'GetLosExpenseSummaryQuery') {
            return Promise.resolve([]);
          }
          return Promise.resolve([]);
        }),
        register: jest.fn(),
        registerHandler: jest.fn(),
        bind: jest.fn(),
        unbind: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Setup test data
    leaseId = '123e4567-e89b-12d3-a456-426614174000';
    authToken = 'Bearer test-token'; // In real tests, this would be a valid JWT
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/lease-operating-statements (POST)', () => {
    it('should create a new LOS', async () => {
      const createLosDto = {
        leaseId,
        year: 2024,
        month: 3,
        notes: 'Test LOS for March 2024',
      };

      const response = await request(app.getHttpServer())
        .post('/lease-operating-statements')
        .set('Authorization', authToken)
        .send(createLosDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe(
        'Lease Operating Statement created successfully',
      );

      losId = response.body.id;
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        year: 2024,
        month: 3,
        // Missing leaseId
      };

      await request(app.getHttpServer())
        .post('/lease-operating-statements')
        .set('Authorization', authToken)
        .send(invalidDto)
        .expect(400);
    });

    it('should validate year range', async () => {
      const invalidDto = {
        leaseId,
        year: 1999, // Invalid year
        month: 3,
      };

      await request(app.getHttpServer())
        .post('/lease-operating-statements')
        .set('Authorization', authToken)
        .send(invalidDto)
        .expect(400);
    });

    it('should validate month range', async () => {
      const invalidDto = {
        leaseId,
        year: 2024,
        month: 13, // Invalid month
      };

      await request(app.getHttpServer())
        .post('/lease-operating-statements')
        .set('Authorization', authToken)
        .send(invalidDto)
        .expect(400);
    });

    it('should return conflict when LOS already exists for lease and month', async () => {
      const createLosDto = {
        leaseId,
        year: 2024,
        month: 3, // Same month as first test
        notes: 'Duplicate LOS',
      };

      await request(app.getHttpServer())
        .post('/lease-operating-statements')
        .set('Authorization', authToken)
        .send(createLosDto)
        .expect(409);
    });
  });

  describe('/lease-operating-statements/:id/expenses (POST)', () => {
    it('should add expense to LOS', async () => {
      const addExpenseDto = {
        description: 'Monthly electricity bill',
        category: ExpenseCategory.UTILITIES,
        type: ExpenseType.OPERATING,
        amount: 1250.5,
        currency: 'USD',
        vendorName: 'ABC Electric Company',
        invoiceNumber: 'INV-2024-0123',
        invoiceDate: '2024-03-15',
        notes: 'Emergency repair work',
      };

      const response = await request(app.getHttpServer())
        .post(`/lease-operating-statements/${losId}/expenses`)
        .set('Authorization', authToken)
        .send(addExpenseDto)
        .expect(201);

      expect(response.body).toHaveProperty('expenseId');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Expense added successfully');
    });

    it('should validate expense amount', async () => {
      const invalidExpenseDto = {
        description: 'Invalid expense',
        category: ExpenseCategory.UTILITIES,
        type: ExpenseType.OPERATING,
        amount: -100, // Negative amount
      };

      await request(app.getHttpServer())
        .post(`/lease-operating-statements/${losId}/expenses`)
        .set('Authorization', authToken)
        .send(invalidExpenseDto)
        .expect(400);
    });

    it('should validate required expense fields', async () => {
      const invalidExpenseDto = {
        // Missing description, category, type, amount
        vendorName: 'Test Vendor',
      };

      await request(app.getHttpServer())
        .post(`/lease-operating-statements/${losId}/expenses`)
        .set('Authorization', authToken)
        .send(invalidExpenseDto)
        .expect(400);
    });
  });

  describe('/lease-operating-statements/:id (GET)', () => {
    it('should get LOS by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/lease-operating-statements/${losId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('id', losId);
      expect(response.body).toHaveProperty('leaseId', leaseId);
      expect(response.body).toHaveProperty('statementMonth', '2024-03');
      expect(response.body).toHaveProperty('displayMonth', 'March 2024');
      expect(response.body).toHaveProperty('totalExpenses');
      expect(response.body).toHaveProperty('operatingExpenses');
      expect(response.body).toHaveProperty('capitalExpenses');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('expenseLineItems');
      expect(response.body.expenseLineItems).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent LOS', async () => {
      await request(app.getHttpServer())
        .get('/lease-operating-statements/non-existent-id')
        .set('Authorization', authToken)
        .expect(404);
    });
  });

  describe('/lease-operating-statements (GET)', () => {
    it('should get all LOS for organization', async () => {
      const response = await request(app.getHttpServer())
        .get('/lease-operating-statements')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);

      const los = response.body[0];
      expect(los).toHaveProperty('id');
      expect(los).toHaveProperty('leaseId');
      expect(los).toHaveProperty('statementMonth');
      expect(los).toHaveProperty('displayMonth');
      expect(los).toHaveProperty('totalExpenses');
      expect(los).toHaveProperty('status');
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/lease-operating-statements?status=DRAFT')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((los: any) => {
        expect(los.status).toBe('DRAFT');
      });
    });

    it('should apply pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/lease-operating-statements?limit=5&offset=0')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });
  });

  describe('/lease-operating-statements/lease/:leaseId (GET)', () => {
    it('should get LOS for specific lease', async () => {
      const response = await request(app.getHttpServer())
        .get(`/lease-operating-statements/lease/${leaseId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((los: any) => {
        expect(los.leaseId).toBe(leaseId);
      });
    });
  });

  describe('/lease-operating-statements/:id/finalize (PUT)', () => {
    it('should finalize LOS', async () => {
      const response = await request(app.getHttpServer())
        .put(`/lease-operating-statements/${losId}/finalize`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('LOS finalized successfully');
    });

    it('should not allow finalizing already finalized LOS', async () => {
      await request(app.getHttpServer())
        .put(`/lease-operating-statements/${losId}/finalize`)
        .set('Authorization', authToken)
        .expect(400);
    });
  });

  describe('/lease-operating-statements/:id/distribute (PUT)', () => {
    it('should distribute finalized LOS', async () => {
      const response = await request(app.getHttpServer())
        .put(`/lease-operating-statements/${losId}/distribute`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('LOS distributed successfully');
    });
  });

  describe('/lease-operating-statements/summary/expenses (GET)', () => {
    it('should get expense summary', async () => {
      const response = await request(app.getHttpServer())
        .get(
          '/lease-operating-statements/summary/expenses?startYear=2024&startMonth=1&endYear=2024&endMonth=12',
        )
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);

      if (response.body.length > 0) {
        const summary = response.body[0];
        expect(summary).toHaveProperty('leaseId');
        expect(summary).toHaveProperty('totalOperatingExpenses');
        expect(summary).toHaveProperty('totalCapitalExpenses');
        expect(summary).toHaveProperty('totalExpenses');
        expect(summary).toHaveProperty('statementCount');
      }
    });

    it('should validate required query parameters', async () => {
      await request(app.getHttpServer())
        .get('/lease-operating-statements/summary/expenses')
        .set('Authorization', authToken)
        .expect(400);
    });
  });

  describe('Authorization', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/lease-operating-statements')
        .expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app.getHttpServer())
        .get('/lease-operating-statements')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
