import { Hono } from 'hono';
import { AccountController } from './controllers/AccountController';
import { AccountService } from './services/AccountService';
import { Account } from './domain/Account';
import { prisma } from '../../lib/prisma';

// Export core types
export type { AccountInterface } from './interfaces/AccountInterface';
export type { AccountType } from './types';

// Export domain models
export { Account } from './domain/Account';

// Export errors
export { BankingError } from './errors/BankingError';

// Create module router
const router = new Hono();

// Initialize account component
const accountService = new AccountService(prisma);
const accountController = new AccountController(accountService);

// Mount routes
router.post('/accounts', accountController.createAccount.bind(accountController));
router.get('/accounts/:id', accountController.getAccount.bind(accountController));
router.get('/families/:familyId/accounts', accountController.getFamilyAccounts.bind(accountController));

// Export router for mounting in main application
export default router;