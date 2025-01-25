import { Hono } from 'hono';
import { BankingController } from '../controllers/banking.controller';
import { requireAuth } from '../middlewares/auth';
import { UserRole } from '../types/user-role';

const router = new Hono();

// Create account (parent only)
router.post('/accounts', requireAuth([UserRole.PARENT]), BankingController.createAccount);

export default router;
