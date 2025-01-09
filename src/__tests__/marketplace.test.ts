import { describe, expect, it, beforeAll, beforeEach, afterAll, afterEach } from '@jest/globals';
import { setupTestDatabase, cleanupTestDatabase } from '../../../__tests__/core/utils/test-setup';
import { createTestUser, createTestFamily, createTestBankAccount } from '../../../__tests__/core/utils/test-helpers';
import { BankAccountService } from '../services/account.service';
import { MarketplaceService } from '../services/marketplace.service';
import { TransactionService } from '../services/transaction.service';
import { prisma } from '../../../lib/prisma';

describe('MarketplaceService', () => {
  // Increase timeout for all tests in this suite
  jest.setTimeout(30000);
  let marketplaceService: MarketplaceService;
  let transactionService: TransactionService;
  let testSeller: any;
  let testBuyer: any;
  let testFamily: any;
  let sellerAccount: any;
  let buyerAccount: any;

  beforeAll(async () => {
    try {
      console.log('Connecting to database...');
      await prisma.$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      await prisma.$disconnect();
      console.log('Database disconnected successfully');
    } catch (error) {
      console.error('Database disconnect failed:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    try {
      console.log('Setting up test database...');
      await setupTestDatabase();
      console.log('Test database setup complete');

      console.log('Initializing services...');
      transactionService = new TransactionService(new BankAccountService());
      marketplaceService = new MarketplaceService(transactionService);
      console.log('Services initialized');

      // Initialize services
      transactionService = new TransactionService(new BankAccountService());
      marketplaceService = new MarketplaceService(transactionService);

      // Create test users
      const timestamp = Date.now();
      testSeller = await createTestUser({
        email: `seller_${timestamp}@test.com`,
        role: 'TEEN',
        firstName: 'Test',
        lastName: 'Seller',
        username: `seller_${timestamp}`
      });

      testBuyer = await createTestUser({ 
        email: `buyer_${timestamp}@test.com`,
        role: 'TEEN',
        firstName: 'Test',
        lastName: 'Buyer',
        username: `buyer_${timestamp}`
      });

      testFamily = await createTestFamily(testSeller.id);
      
      // Create bank accounts
      sellerAccount = await createTestBankAccount({
        userId: testSeller.id,
        familyId: testFamily.id,
        type: 'SAVINGS',
        balance: 100
      });
      
      buyerAccount = await createTestBankAccount({
        userId: testBuyer.id,
        familyId: testFamily.id,
        type: 'SAVINGS',
        balance: 500
      });
      console.log('Test accounts created successfully');
    } catch (error) {
      console.error('Test setup failed:', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      console.log('Cleaning up test database...');
      await prisma.$transaction([
        prisma.marketplacePurchase.deleteMany(),
        prisma.marketplaceListing.deleteMany(),
        prisma.bankingAccount.deleteMany(),
        prisma.user.updateMany({
          where: { familyId: { not: null } },
          data: { familyId: null }
        }),
        prisma.user.deleteMany(),
        prisma.family.deleteMany()
      ]);
      console.log('Test database cleanup complete');
    } catch (error) {
      console.error('Test cleanup failed:', error);
      throw error;
    }
  });

  describe('createListing', () => {
    it('should create a new marketplace listing', async () => {
      const listingData = {
        title: 'Test Item',
        description: 'A test item for sale',
        price: 50,
        sellerId: testSeller.id,
        condition: 'GOOD'
      };

      const listing = await marketplaceService.createListing(listingData);

      expect(listing).toBeDefined();
      expect(listing.status).toBe('AVAILABLE');
      expect(listing.price).toBe(listingData.price);
    });
  });

  describe('purchaseItem', () => {
    it('should create a pending purchase request', async () => {
      const listing = await prisma.marketplaceListing.create({
        data: {
          title: 'Test Item',
          description: 'Test item description',
          price: 50,
          sellerId: testSeller.id,
          condition: 'GOOD',
          status: 'AVAILABLE'
        }
      });

      const purchaseData = {
        listingId: listing.id,
        buyerId: testBuyer.id,
        offeredPrice: 45,
        message: 'Interested in buying'
      };

      const purchase = await marketplaceService.purchaseItem(purchaseData);

      expect(purchase).toBeDefined();
      expect(purchase.status).toBe('PENDING_APPROVAL');
      expect(purchase.price).toBe(purchaseData.offeredPrice);
    });
  });
});
