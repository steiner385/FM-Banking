import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import { createTestApp, createTestContext, cleanupTestData, makeTestRequest, assertSuccessResponse, assertErrorResponse } from '../utils/setup';
import { getPrismaClient } from '../../../../lib/prisma';
import { logger } from '../../utils/logger';

describe('Banking API Integration Tests', () => {
  const prisma = getPrismaClient();
  let app: any;
  let parentCtx: any;
  let childCtx: any;

  beforeAll(async () => {
    try {
      // Create test app with auth middleware
      app = createTestApp({ enableAuth: true });

      // Create parent user context
      parentCtx = await createTestContext({
        userRole: 'PARENT',
        familyName: 'Test Family'
      });

      // Create child user context
      childCtx = await createTestContext({
        userRole: 'CHILD',
        familyName: parentCtx.family.name
      });

      // Log test setup info
      logger.info('Parent token:', { token: parentCtx.token });
      logger.info('Child token:', { token: childCtx.token });
    } catch (error) {
      console.error('Test setup failed:', error);
      await cleanupTestData();
      await prisma.$disconnect();
      throw error;
    }
  });

  afterAll(async () => {
    try {
      await cleanupTestData();
      await prisma.$disconnect();
    } catch (error) {
      console.error('Test cleanup failed:', error);
      throw error;
    }
  });

  describe('POST /api/banking/accounts', () => {
    it('should allow parents to create accounts', async () => {
      const response = await makeTestRequest(app, {
        method: 'POST',
        path: '/api/banking/accounts',
        token: parentCtx.token,
        body: {
          name: 'Test Savings Account',
          type: 'SAVINGS',
          familyId: parentCtx.family.id,
          userId: parentCtx.user.id,
          initialBalance: 100
        }
      });

      const data = await assertSuccessResponse(response, 201);
      expect(data.data).toMatchObject({
        name: 'Test Savings Account',
        type: 'SAVINGS',
        familyId: parentCtx.family.id,
        userId: parentCtx.user.id,
        balance: 100
      });
    });

    it('should not allow children to create accounts', async () => {
      const response = await makeTestRequest(app, {
        method: 'POST',
        path: '/api/banking/accounts',
        token: childCtx.token,
        body: {
          name: 'Child Account',
          type: 'SAVINGS',
          familyId: childCtx.family.id,
          userId: childCtx.user.id
        }
      });

      await assertErrorResponse(response, 403, 'FORBIDDEN');
    });
  });
});