import { Context } from 'hono';
import { BankAccountService } from '../services/account.service';

export class BankAccountController {
  constructor(private accountService: BankAccountService) {}

  async createAccount(c: Context) {
    const data = await c.req.json();
    const account = await this.accountService.createAccount(data);
    return c.json({ data: account });
  }

  async getAccount(c: Context) {
    const { id } = c.req.param();
    const account = await this.accountService.getAccount(id);
    return c.json({ data: account });
  }

  async getFamilyAccounts(c: Context) {
    const { familyId } = c.req.param();
    const { type, userId, sortBy, order } = c.req.query();
    const accounts = await this.accountService.getFamilyAccounts(familyId, {
      type,
      userId,
      sortBy,
      order: order as 'asc' | 'desc' | undefined,
    });
    return c.json({ data: accounts });
  }
}
