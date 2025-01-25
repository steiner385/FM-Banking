import { Hono } from 'hono';
import { AccountController } from '../controllers/AccountController';
import { AccountService } from '../services/AccountService';
import { prisma } from '../../../lib/prisma';

const bankingRouter = new Hono();
const accountService = new AccountService(prisma);
const accountController = new AccountController(accountService);

// Account routes
// Note: Routes are mounted at /api/banking so we include the accounts prefix
bankingRouter.post('/accounts', accountController.createAccount.bind(accountController));
bankingRouter.get('/accounts/:id', accountController.getAccount.bind(accountController));
bankingRouter.get('/accounts/family/:familyId', accountController.getFamilyAccounts.bind(accountController));

export default bankingRouter;
