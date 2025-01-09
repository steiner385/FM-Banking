import { AccountInterface, AccountRepositoryInterface } from '../../interfaces/AccountInterface';
import { Account } from '../../domain/Account';
import { BankingError } from '../../errors';
import { AccountFilters } from '../../types';

export class AccountService {
  constructor(private accountRepository: AccountRepositoryInterface) {}

  async createAccount(data: {
    name: string;
    type: string;
    familyId: string;
    userId: string;
    initialBalance: number;
  }): Promise<AccountInterface> {
    try {
      // Create and validate through domain model
      const account = Account.create({
        name: data.name,
        type: data.type,
        familyId: data.familyId,
        userId: data.userId,
        balance: data.initialBalance
      });

      // Persist using repository
      return this.accountRepository.create({
        name: account.name,
        type: account.type,
        familyId: account.familyId,
        userId: account.userId,
        balance: account.balance
      });
    } catch (error) {
      if (error instanceof BankingError) {
        throw error;
      }
      throw new BankingError({
        code: 'SERVICE_ERROR',
        message: 'Failed to create account',
        entity: 'ACCOUNT',
        details: { error }
      });
    }
  }

  async getAccount(id: string): Promise<AccountInterface> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      throw new BankingError({
        code: 'NOT_FOUND',
        message: `Account with ID ${id} not found`,
        entity: 'ACCOUNT'
      });
    }
    return account;
  }

  async getFamilyAccounts(familyId: string, filters?: AccountFilters): Promise<AccountInterface[]> {
    try {
      console.log('[AccountService] Getting family accounts:', { familyId, filters });
      const accounts = await this.accountRepository.findByFamily(familyId, filters);
      console.log('[AccountService] Retrieved accounts:', accounts);
      // Remove null check since findByFamily always returns an array
      return accounts;
    } catch (error) {
      throw new BankingError({
        code: 'SERVICE_ERROR',
        message: 'Failed to fetch family accounts',
        entity: 'ACCOUNT',
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  async updateBalance(id: string, amount: number): Promise<AccountInterface> {
    const account = await this.getAccount(id);
    
    // Use domain model to validate operation
    const domainAccount = Account.create(account);
    
    if (amount < 0 && !domainAccount.canWithdraw(Math.abs(amount))) {
      throw new BankingError({
        code: 'INSUFFICIENT_FUNDS',
        message: `Insufficient funds: available ${domainAccount.balance}, required ${Math.abs(amount)}`,
        entity: 'ACCOUNT'
      });
    }

    return this.accountRepository.updateBalance(id, amount);
  }
}
