import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { VendorModule } from '../../../modules/vendor.module';
import { DatabaseModule } from '../../../database/database.module';
import { AuthModule } from '../../../modules/auth.module';
import {
  VendorType,
  VendorStatus,
} from '../../../domain/enums/vendor-status.enum';

describe('VendorsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let _organizationId: string;
  let createdVendorId: string;

  const mockAddress = {
    street: '123 Main St',
    city: 'Houston',
    state: 'TX',
    zipCode: '77001',
    country: 'USA',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        DatabaseModule,
        AuthModule,
        VendorModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Add global validation pipe and other middleware
    // app.useGlobalPipes(new ValidationPipe());

    await app.init();

    // Setup test authentication and organization
    await setupTestAuth();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestAuth() {
    // Create test user and organization
    const authResponse = await request(app.getHttpServer())
      .post('/auth/test-login')
      .send({
        email: 'test@example.com',
        role: 'admin',
      })
      .expect(201);

    authToken = authResponse.body.accessToken;
    _organizationId = authResponse.body.organizationId;
  }

  async function cleanupTestData() {
    // Clean up test data
    if (createdVendorId) {
      await request(app.getHttpServer())
        .delete(`/vendors/${createdVendorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    }
  }

  describe('POST /vendors', () => {
    it('should create a new vendor', async () => {
      const createVendorDto = {
        vendorName: 'ACME Corporation',
        vendorCode: 'ACME-001',
        vendorType: VendorType.SERVICE_PROVIDER,
        billingAddress: mockAddress,
        paymentTerms: 'Net 30',
        taxId: '12-3456789',
        website: 'https://acme.com',
        notes: 'Test vendor for e2e testing',
      };

      const response = await request(app.getHttpServer())
        .post('/vendors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createVendorDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty(
        'message',
        'Vendor created successfully',
      );
      expect(response.body.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );

      createdVendorId = response.body.id;
    });

    it('should return 400 for invalid vendor data', async () => {
      const invalidVendorDto = {
        vendorName: '', // Invalid - empty name
        vendorCode: 'AB', // Invalid - too short
        vendorType: 'INVALID_TYPE', // Invalid enum value
        billingAddress: {
          street: '123 Main St',
          // Missing required fields
        },
        paymentTerms: 'Net 30',
      };

      await request(app.getHttpServer())
        .post('/vendors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidVendorDto)
        .expect(400);
    });

    it('should return 409 for duplicate vendor code', async () => {
      const duplicateVendorDto = {
        vendorName: 'Another ACME',
        vendorCode: 'ACME-001', // Same as previously created
        vendorType: VendorType.SERVICE_PROVIDER,
        billingAddress: mockAddress,
        paymentTerms: 'Net 30',
      };

      await request(app.getHttpServer())
        .post('/vendors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateVendorDto)
        .expect(409);
    });

    it('should return 401 without authentication', async () => {
      const createVendorDto = {
        vendorName: 'Test Vendor',
        vendorCode: 'TEST-001',
        vendorType: VendorType.SERVICE_PROVIDER,
        billingAddress: mockAddress,
        paymentTerms: 'Net 30',
      };

      await request(app.getHttpServer())
        .post('/vendors')
        .send(createVendorDto)
        .expect(401);
    });

    it('should return 403 for insufficient permissions', async () => {
      // Create token with operator role (insufficient for creating vendors)
      const operatorResponse = await request(app.getHttpServer())
        .post('/auth/test-login')
        .send({
          email: 'operator@example.com',
          role: 'operator',
        });

      const operatorToken = operatorResponse.body.accessToken;

      const createVendorDto = {
        vendorName: 'Test Vendor',
        vendorCode: 'TEST-002',
        vendorType: VendorType.SERVICE_PROVIDER,
        billingAddress: mockAddress,
        paymentTerms: 'Net 30',
      };

      await request(app.getHttpServer())
        .post('/vendors')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(createVendorDto)
        .expect(403);
    });
  });

  describe('GET /vendors', () => {
    it('should return paginated list of vendors', async () => {
      const response = await request(app.getHttpServer())
        .get('/vendors')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('vendors');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('hasNext');
      expect(response.body).toHaveProperty('hasPrevious');

      expect(Array.isArray(response.body.vendors)).toBe(true);
      expect(response.body.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter vendors by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/vendors')
        .query({ status: VendorStatus.PENDING })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.vendors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            status: VendorStatus.PENDING,
          }),
        ]),
      );
    });

    it('should filter vendors by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/vendors')
        .query({ vendorType: VendorType.SERVICE_PROVIDER })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.vendors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            vendorType: VendorType.SERVICE_PROVIDER,
          }),
        ]),
      );
    });

    it('should search vendors by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/vendors')
        .query({ searchTerm: 'ACME' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.vendors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            vendorName: expect.stringContaining('ACME'),
          }),
        ]),
      );
    });

    it('should paginate results correctly', async () => {
      const page1Response = await request(app.getHttpServer())
        .get('/vendors')
        .query({ page: 1, limit: 1 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(page1Response.body.vendors).toHaveLength(1);
      expect(page1Response.body.page).toBe(1);
      expect(page1Response.body.limit).toBe(1);

      if (page1Response.body.hasNext) {
        const page2Response = await request(app.getHttpServer())
          .get('/vendors')
          .query({ page: 2, limit: 1 })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(page2Response.body.page).toBe(2);
        expect(page2Response.body.vendors[0].id).not.toBe(
          page1Response.body.vendors[0].id,
        );
      }
    });
  });

  describe('GET /vendors/:id', () => {
    it('should return vendor by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/vendors/${createdVendorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdVendorId);
      expect(response.body).toHaveProperty('vendorName', 'ACME Corporation');
      expect(response.body).toHaveProperty('vendorCode', 'ACME-001');
      expect(response.body).toHaveProperty(
        'vendorType',
        VendorType.SERVICE_PROVIDER,
      );
      expect(response.body).toHaveProperty('status', VendorStatus.PENDING);
    });

    it('should return 404 for non-existent vendor', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/vendors/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      await request(app.getHttpServer())
        .get('/vendors/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('PATCH /vendors/:id/status', () => {
    it('should update vendor status', async () => {
      const updateStatusDto = {
        status: VendorStatus.APPROVED,
        reason: 'Meets all requirements',
      };

      await request(app.getHttpServer())
        .patch(`/vendors/${createdVendorId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateStatusDto)
        .expect(200);

      // Verify status was updated
      const response = await request(app.getHttpServer())
        .get(`/vendors/${createdVendorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe(VendorStatus.APPROVED);
    });

    it('should return 400 for invalid status', async () => {
      const invalidStatusDto = {
        status: 'INVALID_STATUS',
      };

      await request(app.getHttpServer())
        .patch(`/vendors/${createdVendorId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidStatusDto)
        .expect(400);
    });
  });

  describe('GET /vendors/statistics', () => {
    it('should return vendor statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/vendors/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalVendors');
      expect(response.body).toHaveProperty('activeVendors');
      expect(response.body).toHaveProperty('pendingApproval');
      expect(response.body).toHaveProperty('suspendedVendors');
      expect(response.body).toHaveProperty('qualifiedVendors');
      expect(response.body).toHaveProperty('recentlyAdded');

      expect(typeof response.body.totalVendors).toBe('number');
      expect(response.body.totalVendors).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /vendors/expiring-qualifications', () => {
    it('should return vendors with expiring qualifications', async () => {
      const response = await request(app.getHttpServer())
        .get('/vendors/expiring-qualifications')
        .query({ days: 30 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Response may be empty if no vendors have expiring qualifications
    });

    it('should use default days parameter', async () => {
      await request(app.getHttpServer())
        .get('/vendors/expiring-qualifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('PUT /vendors/:id/insurance', () => {
    it('should update vendor insurance', async () => {
      const insuranceDto = {
        generalLiability: {
          carrier: 'State Farm',
          policyNumber: 'GL-123456',
          coverageAmount: 1000000,
          expirationDate: '2024-12-31',
        },
        workersCompensation: {
          carrier: 'Workers Comp Inc',
          policyNumber: 'WC-789012',
          coverageAmount: 500000,
          expirationDate: '2024-12-31',
        },
      };

      await request(app.getHttpServer())
        .put(`/vendors/${createdVendorId}/insurance`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(insuranceDto)
        .expect(200);
    });

    it('should return 400 for invalid insurance data', async () => {
      const invalidInsuranceDto = {
        generalLiability: {
          carrier: 'State Farm',
          policyNumber: 'GL-123456',
          coverageAmount: 'invalid', // Should be number
          expirationDate: 'invalid-date',
        },
      };

      await request(app.getHttpServer())
        .put(`/vendors/${createdVendorId}/insurance`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidInsuranceDto)
        .expect(400);
    });
  });

  describe('Rate Limiting and Performance', () => {
    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .get('/vendors')
          .set('Authorization', `Bearer ${authToken}`),
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should cache vendor statistics', async () => {
      const start1 = Date.now();
      await request(app.getHttpServer())
        .get('/vendors/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      await request(app.getHttpServer())
        .get('/vendors/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration2 = Date.now() - start2;

      // Second request should be faster due to caching
      expect(duration2).toBeLessThan(duration1);
    });
  });
});
