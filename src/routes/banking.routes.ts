import { Hono } from 'hono';
import { BankAccountController } from '../controllers/banking/account.controller';
import { TransactionController } from '../controllers/banking/transaction.controller';
import { LoanController } from '../controllers/banking/loan.controller';
import { MarketplaceController } from '../controllers/banking/marketplace.controller';
import { authMiddleware } from '../middleware/auth';
import { parentRoleMiddleware } from '../middleware/roles';

const bankingRouter = new Hono();

// Initialize controllers
const accountController = new BankAccountController();
const transactionController = new TransactionController();
const loanController = new LoanController();
const marketplaceController = new MarketplaceController();

// Apply auth middleware to all routes
bankingRouter.use('*', authMiddleware());

// Account routes
bankingRouter.post('/accounts', parentRoleMiddleware(), accountController.createAccount);
bankingRouter.get('/accounts/:id', accountController.getAccount);
bankingRouter.get('/families/:familyId/accounts', accountController.getFamilyAccounts);

// Transaction routes
bankingRouter.post('/transactions/request', transactionController.requestTransaction);
bankingRouter.post('/transactions', parentRoleMiddleware(), transactionController.createTransaction);
bankingRouter.get('/transactions/pending-approval', parentRoleMiddleware(), transactionController.getPendingApprovals);
bankingRouter.post('/transactions/:id/approve', parentRoleMiddleware(), transactionController.approveTransaction);
bankingRouter.post('/transactions/:id/reject', parentRoleMiddleware(), transactionController.rejectTransaction);
bankingRouter.get('/transactions/:id', transactionController.getTransaction);

// Loan routes
bankingRouter.post('/loans/request', loanController.requestLoan);
bankingRouter.get('/loans/:id', loanController.getLoan);
bankingRouter.get('/loans/user/:userId', loanController.getUserLoans);
bankingRouter.post('/loans/:id/approve', parentRoleMiddleware(), loanController.approveLoan);
bankingRouter.post('/loans/:id/payment', loanController.makeLoanPayment);

// Marketplace routes
bankingRouter.post('/marketplace/listings', marketplaceController.createListing);
bankingRouter.get('/marketplace/listings', marketplaceController.getListings);
bankingRouter.put('/marketplace/listings/:id', marketplaceController.updateListing);
bankingRouter.post('/marketplace/purchases', marketplaceController.purchaseItem);
bankingRouter.post('/marketplace/purchases/:id/approve', parentRoleMiddleware(), marketplaceController.approvePurchase);

export { bankingRouter };
