import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { LeaseOperatingStatementsModule } from '../lease-operating-statements.module';
import { DatabaseModule } from '../../database/database.module';
import { AuthorizationModule } from '../../authorization/authorization.module';
import {
  ExpenseCategory,
  ExpenseType,
} from '../../domain/enums/los-status.enum';

describe('LeaseOperatingStatements (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let leaseId: string;
  let losId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        LeaseOperatingStatementsModule,
        DatabaseModule,
        AuthorizationModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Setup test data
    leaseId = 'test-lease-456';
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
