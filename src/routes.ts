import { Hono } from 'hono';
import { AccountController } from './controllers/account/AccountController';
import { validateParentRole, validateFamilyMemberRole } from './middleware/roleValidation';
import { setUserContext } from './middleware/auth';
import { getPrismaClient } from '../../lib/prisma';

const router = new Hono();
const accountController = new AccountController(getPrismaClient());

// Apply auth middleware globally
router.use('*', setUserContext);

// More specific routes first
router.get('/families/:familyId/accounts', 
  validateFamilyMemberRole,
  accountController.getFamilyAccounts.bind(accountController)
);

router.get('/accounts/:id',
  validateFamilyMemberRole,
  accountController.getAccount.bind(accountController)
);

router.post('/accounts',
  validateParentRole,
  accountController.createAccount.bind(accountController)
);


export default router;
