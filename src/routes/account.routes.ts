import { Router } from 'express';
import { AccountController } from '../controllers/account.controller';
import { validateRole } from '../middleware/role.middleware';

const router = Router();
const accountController = new AccountController();

// Create account (PARENT only)
router.post('/', validateRole(['PARENT']), accountController.createAccount);

// Get account details
router.get('/:id', accountController.getAccount);

// Get family accounts
router.get('/families/:familyId/accounts', accountController.getFamilyAccounts);

// Update account (PARENT only)
router.patch('/:id', validateRole(['PARENT']), accountController.updateAccount);

// Delete account (PARENT only)
router.delete('/:id', validateRole(['PARENT']), accountController.deleteAccount);

export { router as accountRouter };
