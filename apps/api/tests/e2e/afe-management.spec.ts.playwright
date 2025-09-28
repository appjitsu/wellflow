import { test, expect } from '@playwright/test';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { AfesModule } from '../../src/afes/afes.module';
import request from 'supertest';

describe('AFE Management E2E Tests', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, AfesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('AFE Creation Workflow', () => {
    test('should create AFE successfully with valid data', async () => {
      const createAfeDto = {
        afeNumber: 'AFE-2024-0001',
        afeType: 'drilling',
        wellId: '123e4567-e89b-12d3-a456-426614174000',
        leaseId: '123e4567-e89b-12d3-a456-426614174001',
        totalEstimatedCost: 1500000,
        description: 'Test drilling AFE for Playwright validation',
      };

      const response = await request(server)
        .post('/afes')
        .send(createAfeDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty(
        'message',
        'AFE created successfully',
      );
      expect(typeof response.body.id).toBe('string');
    });

    test('should reject AFE creation with invalid data', async () => {
      const invalidAfeDto = {
        afeNumber: 'INVALID-FORMAT',
        afeType: 'invalid-type',
        totalEstimatedCost: -1000, // Invalid negative cost
      };

      await request(server).post('/afes').send(invalidAfeDto).expect(400);
    });

    test('should reject duplicate AFE numbers', async () => {
      const createAfeDto = {
        afeNumber: 'AFE-2024-0002',
        afeType: 'completion',
        totalEstimatedCost: 800000,
        description: 'First AFE',
      };

      // Create first AFE
      await request(server).post('/afes').send(createAfeDto).expect(201);

      // Try to create duplicate
      await request(server).post('/afes').send(createAfeDto).expect(409);
    });
  });

  describe('AFE Retrieval', () => {
    let afeId: string;

    beforeAll(async () => {
      const createAfeDto = {
        afeNumber: 'AFE-2024-0003',
        afeType: 'workover',
        totalEstimatedCost: 500000,
        description: 'Test AFE for retrieval',
      };

      const response = await request(server)
        .post('/afes')
        .send(createAfeDto)
        .expect(201);

      afeId = response.body.id;
    });

    test('should retrieve AFE by ID', async () => {
      const response = await request(server).get(`/afes/${afeId}`).expect(200);

      expect(response.body).toHaveProperty('id', afeId);
      expect(response.body).toHaveProperty('afeNumber', 'AFE-2024-0003');
      expect(response.body).toHaveProperty('afeType', 'workover');
      expect(response.body).toHaveProperty('status', 'draft');
      expect(response.body).toHaveProperty('totalEstimatedCost');
      expect(response.body.totalEstimatedCost).toHaveProperty('amount', 500000);
      expect(response.body.totalEstimatedCost).toHaveProperty(
        'currency',
        'USD',
      );
    });

    test('should return 404 for non-existent AFE', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      await request(server).get(`/afes/${nonExistentId}`).expect(404);
    });

    test('should retrieve AFEs for organization with pagination', async () => {
      const response = await request(server)
        .get('/afes')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('afes');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
      expect(Array.isArray(response.body.afes)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });

    test('should filter AFEs by status', async () => {
      const response = await request(server)
        .get('/afes')
        .query({ status: 'draft' })
        .expect(200);

      expect(
        response.body.afes.every((afe: any) => afe.status === 'draft'),
      ).toBe(true);
    });

    test('should filter AFEs by type', async () => {
      const response = await request(server)
        .get('/afes')
        .query({ afeType: 'drilling' })
        .expect(200);

      expect(
        response.body.afes.every((afe: any) => afe.afeType === 'drilling'),
      ).toBe(true);
    });
  });

  describe('AFE Submission Workflow', () => {
    let afeId: string;

    beforeEach(async () => {
      const createAfeDto = {
        afeNumber: `AFE-2024-${Date.now()}`,
        afeType: 'drilling',
        totalEstimatedCost: 1200000,
        description: 'Test AFE for submission workflow',
      };

      const response = await request(server)
        .post('/afes')
        .send(createAfeDto)
        .expect(201);

      afeId = response.body.id;
    });

    test('should submit AFE successfully', async () => {
      const response = await request(server)
        .put(`/afes/${afeId}/submit`)
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'AFE submitted successfully',
      );

      // Verify status changed
      const afeResponse = await request(server)
        .get(`/afes/${afeId}`)
        .expect(200);

      expect(afeResponse.body.status).toBe('submitted');
    });

    test('should not submit AFE without required fields', async () => {
      // Create AFE without estimated cost
      const invalidAfeDto = {
        afeNumber: `AFE-2024-${Date.now()}`,
        afeType: 'drilling',
        // Missing totalEstimatedCost and description
      };

      const createResponse = await request(server)
        .post('/afes')
        .send(invalidAfeDto)
        .expect(201);

      const invalidAfeId = createResponse.body.id;

      // Try to submit invalid AFE
      await request(server).put(`/afes/${invalidAfeId}/submit`).expect(400);
    });
  });

  describe('AFE Approval Workflow', () => {
    let submittedAfeId: string;

    beforeEach(async () => {
      // Create and submit AFE
      const createAfeDto = {
        afeNumber: `AFE-2024-${Date.now()}`,
        afeType: 'completion',
        totalEstimatedCost: 900000,
        description: 'Test AFE for approval workflow',
      };

      const createResponse = await request(server)
        .post('/afes')
        .send(createAfeDto)
        .expect(201);

      submittedAfeId = createResponse.body.id;

      await request(server).put(`/afes/${submittedAfeId}/submit`).expect(200);
    });

    test('should approve AFE successfully', async () => {
      const approvalDto = {
        approvedAmount: 850000,
        comments: 'Approved with reduced scope',
      };

      const response = await request(server)
        .put(`/afes/${submittedAfeId}/approve`)
        .send(approvalDto)
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'AFE approved successfully',
      );

      // Verify status and approved amount
      const afeResponse = await request(server)
        .get(`/afes/${submittedAfeId}`)
        .expect(200);

      expect(afeResponse.body.status).toBe('approved');
      expect(afeResponse.body.approvedAmount).toHaveProperty('amount', 850000);
      expect(afeResponse.body.approvalDate).toBeDefined();
    });

    test('should reject AFE successfully', async () => {
      const rejectionDto = {
        reason: 'Cost exceeds budget allocation',
      };

      const response = await request(server)
        .put(`/afes/${submittedAfeId}/reject`)
        .send(rejectionDto)
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'AFE rejected successfully',
      );

      // Verify status changed
      const afeResponse = await request(server)
        .get(`/afes/${submittedAfeId}`)
        .expect(200);

      expect(afeResponse.body.status).toBe('rejected');
    });

    test('should not approve draft AFE', async () => {
      // Create draft AFE
      const createAfeDto = {
        afeNumber: `AFE-2024-${Date.now()}`,
        afeType: 'facility',
        totalEstimatedCost: 600000,
        description: 'Draft AFE',
      };

      const createResponse = await request(server)
        .post('/afes')
        .send(createAfeDto)
        .expect(201);

      const draftAfeId = createResponse.body.id;

      // Try to approve draft AFE
      await request(server)
        .put(`/afes/${draftAfeId}/approve`)
        .send({ approvedAmount: 600000 })
        .expect(400);
    });
  });

  describe('AFE Cost Management', () => {
    let approvedAfeId: string;

    beforeEach(async () => {
      // Create, submit, and approve AFE
      const createAfeDto = {
        afeNumber: `AFE-2024-${Date.now()}`,
        afeType: 'drilling',
        totalEstimatedCost: 1000000,
        description: 'Test AFE for cost management',
      };

      const createResponse = await request(server)
        .post('/afes')
        .send(createAfeDto)
        .expect(201);

      approvedAfeId = createResponse.body.id;

      await request(server).put(`/afes/${approvedAfeId}/submit`).expect(200);

      await request(server)
        .put(`/afes/${approvedAfeId}/approve`)
        .send({ approvedAmount: 950000 })
        .expect(200);
    });

    test('should update actual cost for approved AFE', async () => {
      const costUpdateDto = {
        actualCost: 920000,
      };

      const response = await request(server)
        .put(`/afes/${approvedAfeId}/cost`)
        .send(costUpdateDto)
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'AFE costs updated successfully',
      );

      // Verify actual cost updated
      const afeResponse = await request(server)
        .get(`/afes/${approvedAfeId}`)
        .expect(200);

      expect(afeResponse.body.actualCost).toHaveProperty('amount', 920000);
    });

    test('should not update estimated cost after submission', async () => {
      const costUpdateDto = {
        estimatedCost: 1100000,
      };

      await request(server)
        .put(`/afes/${approvedAfeId}/cost`)
        .send(costUpdateDto)
        .expect(400);
    });
  });

  describe('AFE Pending Approvals', () => {
    test('should retrieve AFEs requiring approval', async () => {
      const response = await request(server)
        .get('/afes/pending/approval')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // All returned AFEs should be in submitted status
      response.body.forEach((afe: any) => {
        expect(afe.status).toBe('submitted');
      });
    });
  });
});
