import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import { createTestApp, createTestContext, cleanupTestData, makeTestRequest, assertSuccessResponse, assertErrorResponse } from '../utils/setup';
import { getPrismaClient } from '../../../../lib/prisma';
import { BankAccount } from '@prisma/client';
import { generateToken } from '../../utils/auth';

describe('Banking Module Integration Tests', () => {
  const prisma = getPrismaClient();
  let app: any;
  let ctx: any;

  beforeAll(async () => {
    // Create test app with auth middleware
    app = createTestApp({ enableAuth: true });

    // Create test context with family and parent user
    ctx = await createTestContext({
      userRole: 'PARENT',
      familyName: 'Test Family'
    });
  });

  afterEach(async () => {
    // Clean up test data but preserve family and user context
    await cleanupTestData(true);
  });

  afterAll(async () => {
    try {
      // Full cleanup including family and user data
      await cleanupTestData();
      await prisma.$disconnect();
    } catch (error) {
      console.error('Test cleanup failed:', error);
      throw error;
    }
  });

  describe('Account Management', () => {
    describe('POST /accounts', () => {
      it('should allow parents to create accounts', async () => {
        // Create account request
        const response = await makeTestRequest(app, {
          method: 'POST',
          path: '/api/banking/accounts',
          token: ctx.token,
          body: {
            name: 'Test Savings Account',
            type: 'SAVINGS',
            familyId: ctx.family.id,
            userId: ctx.user.id,
            initialBalance: 100
          }
        });

        const data = await assertSuccessResponse(response, 201);
        expect(data.data).toMatchObject({
          name: 'Test Savings Account',
          type: 'SAVINGS',
          familyId: ctx.family.id,
          userId: ctx.user.id,
          balance: 100
        });
      });

      it('should validate required fields', async () => {
        const response = await makeTestRequest(app, {
          method: 'POST',
          path: '/api/banking/accounts',
          token: ctx.token,
          body: {}
        });

        await assertErrorResponse(response, 400, 'VALIDATION_ERROR');
      });

      it('should require authentication', async () => {
        const response = await makeTestRequest(app, {
          method: 'POST',
          path: '/api/banking/accounts',
          body: {
            name: 'Test Account',
            type: 'SAVINGS',
            familyId: ctx.family.id,
            userId: ctx.user.id
          }
        });

        await assertErrorResponse(response, 401, 'UNAUTHORIZED');
      });

      it('should prevent child users from creating accounts', async () => {
        // Create child user context
        const childCtx = await createTestContext({
          userRole: 'CHILD',
          familyName: ctx.family.name
        });

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

      it('should validate account type', async () => {
        const response = await makeTestRequest(app, {
          method: 'POST',
          path: '/api/banking/accounts',
          token: ctx.token,
          body: {
            name: 'Invalid Account',
            type: 'INVALID_TYPE',
            familyId: ctx.family.id,
            userId: ctx.user.id
          }
        });

        const error = await assertErrorResponse(response, 400, 'VALIDATION_ERROR');
        expect(error.error.details?.allowedTypes).toBeDefined();
      });
    });

    describe('GET /families/:familyId/accounts', () => {
      let childCtx: any;
      
      beforeEach(async () => {
        // Create child user in the same family
        childCtx = await createTestContext({
          userRole: 'CHILD',
          familyName: ctx.family.name
        });

        // Update child user's familyId to match parent's family and ensure role is set
        await prisma.user.update({
          where: { id: childCtx.user.id },
          data: { 
            familyId: ctx.family.id,
            role: 'CHILD'
          }
        });

        // Create parent account
        await makeTestRequest(app, {
          method: 'POST',
          path: '/api/banking/accounts',
          token: ctx.token,
          body: {
            name: 'Parent Account',
            type: 'SAVINGS',
            familyId: ctx.family.id,
            userId: ctx.user.id,
            initialBalance: 100
          }
        });

        // Create child account
        await makeTestRequest(app, {
          method: 'POST',
          path: '/api/banking/accounts',
          token: ctx.token, // Use parent token to create child account
          body: {
            name: 'Child Account',
            type: 'ALLOWANCE',
            familyId: ctx.family.id,
            userId: childCtx.user.id,
            initialBalance: 50
          }
        });
      });

      it('should return all family accounts for parent users', async () => {
        // Get family accounts
        const response = await makeTestRequest(app, {
          method: 'GET',
          path: `/api/banking/families/${ctx.family.id}/accounts`,
          token: ctx.token
        });

        const data = await assertSuccessResponse(response);
        expect(Array.isArray(data.data)).toBe(true);
        expect(data.data.length).toBe(2); // Should see both accounts
        expect(data.data.some((acc: BankAccount) => acc.userId === ctx.user.id)).toBe(true);
        expect(data.data.some((acc: BankAccount) => acc.userId === childCtx.user.id)).toBe(true);
      });

      it('should only return own accounts for child users', async () => {
        const response = await makeTestRequest(app, {
          method: 'GET',
          path: `/api/banking/families/${ctx.family.id}/accounts`,
          token: childCtx.token
        });

        const data = await assertSuccessResponse(response);
        expect(Array.isArray(data.data)).toBe(true);
        expect(data.data.length).toBe(1); // Should only see their own account
        expect(data.data[0].userId).toBe(childCtx.user.id);
      });

      it('should filter accounts by type', async () => {
        // First create a family
        const parentFamily = await prisma.family.create({
          data: {
            name: 'Test Family'
          }
        });

        // Create parent user and associate with family in a single operation
        const parentUser = await prisma.user.create({
          data: {
            email: `parent_${Date.now()}@test.com`,
            password: 'test-password',
            firstName: 'Parent',
            lastName: 'User',
            username: `parent_${Date.now()}`,
            role: 'PARENT',
            familyId: parentFamily.id // Direct association
          }
        });

        // Update family to explicitly connect parent user
        await prisma.family.update({
          where: { id: parentFamily.id },
          data: {
            members: {
              connect: [{ id: parentUser.id }]
            }
          }
        });

        // Generate parent token
        const parentToken = await generateToken({
          userId: parentUser.id,
          email: parentUser.email,
          role: parentUser.role
        });

        // Create child user in the same family
        const childUser = await prisma.user.create({
          data: {
            email: `child_${Date.now()}@test.com`,
            password: 'test-password',
            firstName: 'Child',
            lastName: 'User',
            username: `child_${Date.now()}`,
            role: 'CHILD',
            familyId: parentFamily.id  // Associate with same family
          }
        });

        // Update family to explicitly connect child user
        await prisma.family.update({
          where: { id: parentFamily.id },
          data: {
            members: {
              connect: [{ id: childUser.id }]
            }
          }
        });

        // Create savings account for parent
        const savingsResponse = await makeTestRequest(app, {
          method: 'POST',
          path: '/api/banking/accounts',
          token: parentToken,
          body: {
            name: 'Savings Account',
            type: 'SAVINGS',
            familyId: parentFamily.id,
            userId: parentUser.id,
            initialBalance: 100
          }
        });

        await assertSuccessResponse(savingsResponse, 201);

        // Create allowance account for child
        const allowanceResponse = await makeTestRequest(app, {
          method: 'POST',
          path: '/api/banking/accounts',
          token: parentToken, // Use parent token since only parents can create accounts
          body: {
            name: 'Allowance Account',
            type: 'ALLOWANCE',
            familyId: parentFamily.id,
            userId: childUser.id,
            initialBalance: 50
          }
        });

        await assertSuccessResponse(allowanceResponse, 201);

        // Test filtering accounts by type
        const response = await makeTestRequest(app, {
          method: 'GET',
          path: `/api/banking/families/${parentFamily.id}/accounts?type=ALLOWANCE`,
          token: parentToken
        });

        const data = await assertSuccessResponse(response);
        expect(Array.isArray(data.data)).toBe(true);
        expect(data.data.length).toBe(1);
        expect(data.data[0].type).toBe('ALLOWANCE');
        expect(data.data[0].name).toBe('Allowance Account');
      });

      it('should validate account type in filter', async () => {
        const response = await makeTestRequest(app, {
          method: 'GET',
          path: `/api/banking/families/${ctx.family.id}/accounts?type=INVALID_TYPE`,
          token: ctx.token
        });

        const error = await assertErrorResponse(response, 400, 'VALIDATION_ERROR');
        expect(error.error.details?.allowedTypes).toBeDefined();
      });

      it('should prevent access to other family accounts', async () => {
        // Create another family and user
        const otherCtx = await createTestContext({
          userRole: 'PARENT',
          familyName: 'Other Family'
        });

        // Try to access other family's accounts
        const response = await makeTestRequest(app, {
          method: 'GET',
          path: `/api/banking/families/${ctx.family.id}/accounts`,
          token: otherCtx.token
        });

        await assertErrorResponse(response, 403, 'USER_NOT_IN_FAMILY');
      });
    });
  });
});
